#!/usr/bin/env node
/**
 * Smoke tests M1 — valida migración + RLS del marketplace.
 *
 * Corre Q1..Q6 del QA de `workflows/M01-providers-schema/qa.md` y reporta
 * PASS/FAIL. Idempotente: limpia las filas que inserta para tests (solicitudes
 * + favoritos de prueba) y restaura el estado del dummy `dj-aurora`.
 *
 * Uso:  node scripts/smoke-m1.mjs
 *
 * Requiere `.env.local`:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SR || SR.startsWith("tu_")) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

// service_role bypassa RLS (para setup + verificaciones).
const admin = createClient(URL, SR, {
  auth: { persistSession: false, autoRefreshToken: false },
});
// anon key simula visitante no logueado (para tests de RLS pública).
const anon = createClient(URL, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const results = [];
function record(id, label, pass, detail = "") {
  results.push({ id, label, pass, detail });
  const icon = pass ? "✓" : "✗";
  const color = pass ? "\x1b[32m" : "\x1b[31m";
  const reset = "\x1b[0m";
  console.log(`${color}${icon}${reset} ${id} ${label}${detail ? `  — ${detail}` : ""}`);
}

async function q1_lectura_publica_y_rls_update() {
  // Anon SELECT debería ver 5 aprobados.
  const { data: rows, error: selErr } = await anon
    .from("proveedores")
    .select("id, slug, estado");
  if (selErr) {
    record("Q1a", "anon SELECT proveedores", false, selErr.message);
    return;
  }
  const aprobados = (rows ?? []).filter((r) => r.estado === "aprobado");
  record(
    "Q1a",
    "anon ve proveedores aprobados",
    aprobados.length === 5,
    `vio ${aprobados.length} aprobados`,
  );

  // Anon UPDATE debe ser bloqueado por RLS (no debe afectar la fila).
  const { data: before } = await admin
    .from("proveedores")
    .select("plan")
    .eq("slug", "studio-luz")
    .single();

  await anon
    .from("proveedores")
    .update({ plan: before.plan === "premium" ? "free" : "premium" })
    .eq("slug", "studio-luz");

  const { data: after } = await admin
    .from("proveedores")
    .select("plan")
    .eq("slug", "studio-luz")
    .single();

  record(
    "Q1b",
    "anon UPDATE proveedores bloqueado",
    before.plan === after.plan,
    `plan ${before.plan} → ${after.plan}`,
  );
}

async function q2_pendiente_no_listado() {
  // Marcar DJ Aurora como pendiente.
  await admin
    .from("proveedores")
    .update({ estado: "pendiente" })
    .eq("slug", "dj-aurora");

  const { count: cardsCount } = await anon
    .from("v_marketplace_tarjetas")
    .select("id", { count: "exact", head: true });

  const { data: proveedoresAnon } = await anon
    .from("proveedores")
    .select("slug");

  const veAurora = (proveedoresAnon ?? []).some((p) => p.slug === "dj-aurora");

  record(
    "Q2a",
    "v_marketplace_tarjetas filtra pendientes",
    cardsCount === 4,
    `count=${cardsCount} (esperado 4)`,
  );
  record(
    "Q2b",
    "anon NO ve proveedor pendiente por slug",
    !veAurora,
    veAurora ? "dj-aurora visible (fail)" : "dj-aurora oculto ok",
  );

  // Restaurar.
  await admin
    .from("proveedores")
    .update({ estado: "aprobado" })
    .eq("slug", "dj-aurora");
}

async function q3_unique_solicitud_por_dia() {
  // Limpiar solicitudes de tests previos en el día (idempotencia).
  await admin
    .from("proveedor_solicitudes")
    .delete()
    .eq("mensaje", "__smoke_m1_q3__");

  const { data: proveedor } = await admin
    .from("proveedores")
    .select("id, solicitudes_mes")
    .eq("slug", "studio-luz")
    .single();
  const { data: remitente } = await admin
    .from("proveedores")
    .select("user_id")
    .eq("slug", "dj-aurora")
    .single();

  // Reset contador para que Q4 mida un delta limpio.
  await admin
    .from("proveedores")
    .update({ solicitudes_mes: 0 })
    .eq("id", proveedor.id);

  // Primer insert → OK.
  const { error: firstErr } = await admin
    .from("proveedor_solicitudes")
    .insert({
      proveedor_id: proveedor.id,
      remitente_user_id: remitente.user_id,
      canal: "whatsapp",
      mensaje: "__smoke_m1_q3__",
    });
  record(
    "Q3a",
    "primer INSERT solicitud OK",
    !firstErr,
    firstErr?.message ?? "insertada",
  );

  // Segundo insert idéntico → UNIQUE violation (SQLSTATE 23505).
  const { error: secondErr } = await admin
    .from("proveedor_solicitudes")
    .insert({
      proveedor_id: proveedor.id,
      remitente_user_id: remitente.user_id,
      canal: "whatsapp",
      mensaje: "__smoke_m1_q3_dup__",
    });
  const isDup = secondErr?.code === "23505" ||
    /duplicate key/i.test(secondErr?.message ?? "");
  record(
    "Q3b",
    "segundo INSERT bloqueado por UNIQUE",
    isDup,
    secondErr ? `code=${secondErr.code}` : "no error (fail)",
  );

  return proveedor.id;
}

async function q4_trigger_bump_solicitudes_mes(proveedorId) {
  const { data } = await admin
    .from("proveedores")
    .select("solicitudes_mes")
    .eq("id", proveedorId)
    .single();
  record(
    "Q4",
    "trigger bump solicitudes_mes",
    data.solicitudes_mes === 1,
    `solicitudes_mes=${data.solicitudes_mes} (esperado 1)`,
  );
}

async function q5_trigger_updated_at() {
  const { data: before } = await admin
    .from("proveedores")
    .select("updated_at")
    .eq("slug", "flores-de-rocio")
    .single();

  await new Promise((r) => setTimeout(r, 100));

  await admin
    .from("proveedores")
    .update({ eslogan: "__smoke_m1_q5__" })
    .eq("slug", "flores-de-rocio");

  const { data: after } = await admin
    .from("proveedores")
    .select("updated_at")
    .eq("slug", "flores-de-rocio")
    .single();

  const moved = new Date(after.updated_at) > new Date(before.updated_at);
  record(
    "Q5",
    "trigger updated_at on UPDATE",
    moved,
    `${before.updated_at} → ${after.updated_at}`,
  );

  // Restaurar eslogan (no crítico, pero deja dummy limpio).
  await admin
    .from("proveedores")
    .update({ eslogan: "Diseño floral silvestre y romántico" })
    .eq("slug", "flores-de-rocio");
}

async function q6_unique_favoritos_null_safe() {
  // Buscamos o creamos un evento de prueba del user dummy de Aurora.
  const { data: auroraUser } = await admin
    .from("proveedores")
    .select("user_id")
    .eq("slug", "dj-aurora")
    .single();

  // Evento temporal para el test.
  const { data: eventoNuevo, error: evErr } = await admin
    .from("eventos")
    .insert({ nombre_evento: "__smoke_m1_q6__" })
    .select("id")
    .single();
  if (evErr) {
    record("Q6", "UNIQUE favoritos NULL-safe", false, `no se pudo crear evento: ${evErr.message}`);
    return;
  }

  // Asociar user como miembro admin (el trigger del evento lo hubiera hecho con auth.uid,
  // pero estamos vía service role sin auth.uid → insertamos a mano).
  await admin
    .from("evento_miembros")
    .insert({ evento_id: eventoNuevo.id, user_id: auroraUser.user_id, rol: "admin" });

  const { data: proveedor } = await admin
    .from("proveedores")
    .select("id")
    .eq("slug", "studio-luz")
    .single();

  // Primer insert → OK.
  const { error: firstErr } = await admin
    .from("proveedor_favoritos")
    .insert({
      evento_id: eventoNuevo.id,
      proveedor_id: proveedor.id,
      agregado_por: auroraUser.user_id,
      servicio_id: null,
    });
  const insertOk = !firstErr;

  // Segundo idéntico (servicio_id=NULL) → UNIQUE NULL-safe debe bloquear.
  const { error: secondErr } = await admin
    .from("proveedor_favoritos")
    .insert({
      evento_id: eventoNuevo.id,
      proveedor_id: proveedor.id,
      agregado_por: auroraUser.user_id,
      servicio_id: null,
    });
  const isDup = secondErr?.code === "23505" ||
    /duplicate key/i.test(secondErr?.message ?? "");

  record(
    "Q6",
    "UNIQUE favoritos NULL-safe (servicio_id=NULL)",
    insertOk && isDup,
    `1st=${insertOk ? "ok" : firstErr?.message} · 2nd=${isDup ? "bloqueado" : "no bloqueado"}`,
  );

  // Cleanup: borrar evento → cascade borra evento_miembros + favoritos.
  await admin.from("eventos").delete().eq("id", eventoNuevo.id);
}

async function cleanup() {
  await admin
    .from("proveedor_solicitudes")
    .delete()
    .like("mensaje", "__smoke_m1_%");

  // Resetear solicitudes_mes de cualquier proveedor tocado por los tests.
  await admin
    .from("proveedores")
    .update({ solicitudes_mes: 0 })
    .in("slug", ["studio-luz", "dj-aurora", "vina-sur", "mesa-nueve-catering", "flores-de-rocio"]);
}

async function main() {
  console.log("→ Smoke tests M1 (JUR-36)\n");

  try {
    await q1_lectura_publica_y_rls_update();
    await q2_pendiente_no_listado();
    const proveedorId = await q3_unique_solicitud_por_dia();
    await q4_trigger_bump_solicitudes_mes(proveedorId);
    await q5_trigger_updated_at();
    await q6_unique_favoritos_null_safe();
  } finally {
    await cleanup();
  }

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  const allGreen = passed === total;

  console.log(`\n${allGreen ? "\x1b[32m" : "\x1b[31m"}${passed}/${total} checks passed\x1b[0m`);
  if (!allGreen) {
    console.log("\nFailures:");
    for (const r of results.filter((r) => !r.pass)) {
      console.log(`  ${r.id} — ${r.label} — ${r.detail}`);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
