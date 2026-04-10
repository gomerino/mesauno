import { createStrictServiceClient } from "@/lib/supabase/server";
import { buildRecordatorioEmailHtml } from "@/lib/invitacion-email";
import { getCanonicalSiteOriginFromEnv } from "@/lib/public-origin";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type ElegibleRow = {
  invitado_id: string;
  evento_id: string;
  email: string;
  nombre_pasajero: string;
  token_acceso: string;
  conteo_recordatorios: number;
  fecha_envio: string;
  ultimo_recordatorio_at: string | null;
  max_recordatorios: number;
  frecuencia_recordatorios: number;
  nombre_novio_1: string | null;
  nombre_novio_2: string | null;
};

function verifyCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.startsWith("tu_")) {
    return false;
  }
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const h = request.headers.get("x-cron-secret");
  return h === secret;
}

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    return NextResponse.json({ error: "Resend no configurado" }, { status: 503 });
  }

  const db = await createStrictServiceClient();
  if (!db) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY requerida" }, { status: 503 });
  }

  // Elegibilidad en BD: recordatorios_activos, (fecha_inicio_recordatorios is null or <= current_date), RSVP pendiente, cadencia, etc.
  const { data: rows, error: rpcErr } = await db.rpc("invitados_elegibles_recordatorio", {});
  if (rpcErr) {
    console.error("[cron/reminders] rpc", rpcErr.message);
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });
  }

  const list = (rows ?? []) as ElegibleRow[];
  const origin =
    getCanonicalSiteOriginFromEnv() ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}` : null) ??
    "http://localhost:3000";

  const resend = new Resend(apiKey);
  let enviados = 0;
  let fallidos = 0;
  const detalle: string[] = [];

  for (const row of list) {
    const emailTo = row.email.trim();
    const access = row.token_acceso ?? row.invitado_id;
    const link = `${origin.replace(/\/$/, "")}/invitacion/${access}`;
    const firmantes =
      [row.nombre_novio_1, row.nombre_novio_2].filter(Boolean).join(" y ") || "Los novios";
    const saludoNombres = row.nombre_pasajero?.trim() ?? "";
    const html = buildRecordatorioEmailHtml({ link, firmantes, saludoNombres });
    const subject = `Recordatorio: confirma tu asistencia — ${firmantes}`;

    const { error: sendErr } = await resend.emails.send({
      from,
      to: emailTo,
      subject,
      html,
    });

    const now = new Date().toISOString();

    if (sendErr) {
      fallidos += 1;
      detalle.push(`${row.invitado_id}: ${sendErr.message}`);
      await db.from("log_recordatorios").insert({
        invitado_id: row.invitado_id,
        evento_id: row.evento_id,
        email_to: emailTo,
        asunto: subject,
        tipo: "recordatorio",
        exito: false,
        mensaje_error: sendErr.message ?? "Error Resend",
      });
      continue;
    }

    enviados += 1;
    await db.from("log_recordatorios").insert({
      invitado_id: row.invitado_id,
      evento_id: row.evento_id,
      email_to: emailTo,
      asunto: subject,
      tipo: "recordatorio",
      exito: true,
      mensaje_error: null,
    });

    await db
      .from("invitados")
      .update({
        conteo_recordatorios: row.conteo_recordatorios + 1,
        ultimo_recordatorio_at: now,
      })
      .eq("id", row.invitado_id);
  }

  return NextResponse.json({
    ok: true,
    candidatos: list.length,
    enviados,
    fallidos,
    detalle: detalle.length ? detalle : undefined,
  });
}

/** Vercel Cron suele usar GET. */
export async function GET(request: Request) {
  return POST(request);
}
