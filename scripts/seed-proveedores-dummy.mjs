#!/usr/bin/env node
/**
 * Seed dummy — 5 proveedores aprobados para staging.
 *
 * ⚠️  NO CORRER EN PRODUCCIÓN.
 *     Crea un auth.user por proveedor (password fijo) + fila aprobada +
 *     servicios + medios (URLs de Unsplash placeholder).
 *
 * Uso:
 *   node scripts/seed-proveedores-dummy.mjs
 *
 * Requiere en `.env.local`:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (obligatoria; crea users vía Auth Admin)
 *
 * Idempotente: si el email ya existe, reusa el user y upsertea el proveedor.
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
const SR_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SR_KEY || SR_KEY.startsWith("tu_")) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY válidas.");
  process.exit(1);
}

const supabase = createClient(URL, SR_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PASSWORD = "Proveedor2026!";

const PROVEEDORES = [
  {
    email: "studio.luz@dummy.jurnex.cl",
    nombre_negocio: "Studio Luz",
    slug: "studio-luz",
    eslogan: "Capturamos cada pausa con luz natural",
    biografia: "Estudio especializado en bodas con enfoque documental y luz natural. 8 años, 200+ eventos. Equipo de 3 fotógrafos.",
    region: "metropolitana",
    ciudad: "Santiago",
    categoria_principal: "fotografia",
    whatsapp: "+56911111111",
    instagram: "@studioluz",
    plan: "premium",
    servicios: [
      { nombre: "Pack Esencial", descripcion: "6h de cobertura + entrega digital", categoria: "fotografia", precio_desde_clp: 900000 },
      { nombre: "Pack Premium", descripcion: "10h + álbum impreso + segundo fotógrafo", categoria: "fotografia", precio_desde_clp: 1800000 },
      { nombre: "Pre-boda", descripcion: "Sesión previa 2h al aire libre", categoria: "fotografia", precio_desde_clp: 350000 },
    ],
    medios: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1525772764200-be829a350797?w=1600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1522673607200-164d1b3ce551?w=1600&auto=format&fit=crop&q=60",
    ],
  },
  {
    email: "dj.aurora@dummy.jurnex.cl",
    nombre_negocio: "DJ Aurora",
    slug: "dj-aurora",
    eslogan: "Música en vivo que cuenta tu historia",
    biografia: "DJ profesional con set-list personalizado por pareja. Setup completo: sonido, iluminación y mixer.",
    region: "valparaiso",
    ciudad: "Viña del Mar",
    categoria_principal: "musica",
    whatsapp: "+56922222222",
    instagram: "@djaurora",
    plan: "free",
    servicios: [
      { nombre: "DJ + Equipo", descripcion: "5h de fiesta con setup completo", categoria: "musica", precio_desde_clp: 650000 },
      { nombre: "DJ + Ceremonia + Recepción", descripcion: "Acompaña todo el día", categoria: "musica", precio_desde_clp: 950000 },
    ],
    medios: [
      "https://images.unsplash.com/photo-1571266028243-d220c6b81c37?w=1600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&auto=format&fit=crop&q=60",
    ],
  },
  {
    email: "vina.sur@dummy.jurnex.cl",
    nombre_negocio: "Viña Sur",
    slug: "vina-sur",
    eslogan: "Un valle hecho para decir sí",
    biografia: "Viña boutique en el Valle de Colchagua. Capacidad hasta 180 personas. Incluye alojamiento para novios.",
    region: "ohiggins",
    ciudad: "Santa Cruz",
    categoria_principal: "lugar",
    whatsapp: "+56933333333",
    instagram: "@vinasur",
    plan: "premium",
    servicios: [
      { nombre: "Full Day", descripcion: "Lugar + ceremonia + recepción hasta 180p", categoria: "lugar", precio_desde_clp: 3500000 },
      { nombre: "Intimate", descripcion: "Hasta 60 personas en sala interior", categoria: "lugar", precio_desde_clp: 1800000 },
    ],
    medios: [
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=1600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1600&auto=format&fit=crop&q=60&sig=2",
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&auto=format&fit=crop&q=60&sig=3",
    ],
  },
  {
    email: "mesa.nueve@dummy.jurnex.cl",
    nombre_negocio: "Mesa Nueve Catering",
    slug: "mesa-nueve-catering",
    eslogan: "Cocina de autor para el día más importante",
    biografia: "Catering con enfoque en productos locales de temporada. Menú degustación 5 tiempos + cocktail.",
    region: "metropolitana",
    ciudad: "Providencia",
    categoria_principal: "catering",
    whatsapp: "+56944444444",
    instagram: "@mesanueve",
    plan: "free",
    servicios: [
      { nombre: "Cocktail + Cena", descripcion: "4 aperitivos + 3 tiempos + postre", categoria: "catering", precio_desde_clp: 65000 },
      { nombre: "Buffet Extendido", descripcion: "Estaciones de comida en vivo", categoria: "catering", precio_desde_clp: 85000 },
    ],
    medios: [
      "https://images.unsplash.com/photo-1555244162-803834f70033?w=1600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1600&auto=format&fit=crop&q=60",
    ],
  },
  {
    email: "flores.rocio@dummy.jurnex.cl",
    nombre_negocio: "Flores de Rocío",
    slug: "flores-de-rocio",
    eslogan: "Diseño floral silvestre y romántico",
    biografia: "Estudio de diseño floral para bodas. Especialidad en paletas pasteles y flores de temporada local.",
    region: "metropolitana",
    ciudad: "Ñuñoa",
    categoria_principal: "flores",
    whatsapp: "+56955555555",
    instagram: "@floresderocio",
    plan: "free",
    servicios: [
      { nombre: "Bouquet + Boutonnière", descripcion: "Ramo novia + boutonnière", categoria: "flores", precio_desde_clp: 180000 },
      { nombre: "Centros de mesa (10u)", descripcion: "Diseño silvestre pastel", categoria: "flores", precio_desde_clp: 420000 },
      { nombre: "Arco floral", descripcion: "Para ceremonia al aire libre", categoria: "flores", precio_desde_clp: 680000 },
    ],
    medios: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1600&auto=format&fit=crop&q=60",
    ],
  },
];

async function asegurarUser(email) {
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existente = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existente) return existente.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  return data.user.id;
}

async function upsertProveedor(userId, spec) {
  const { data: existente } = await supabase
    .from("proveedores")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const payload = {
    user_id: userId,
    slug: spec.slug,
    nombre_negocio: spec.nombre_negocio,
    eslogan: spec.eslogan,
    biografia: spec.biografia,
    region: spec.region,
    ciudad: spec.ciudad,
    categoria_principal: spec.categoria_principal,
    whatsapp: spec.whatsapp,
    instagram: spec.instagram,
    estado: "aprobado",
    plan: spec.plan,
    plan_inicio_at: spec.plan === "premium" ? new Date().toISOString() : null,
  };

  if (existente) {
    const { error } = await supabase
      .from("proveedores")
      .update(payload)
      .eq("id", existente.id);
    if (error) throw new Error(`update proveedor: ${error.message}`);
    return existente.id;
  }

  const { data, error } = await supabase
    .from("proveedores")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw new Error(`insert proveedor: ${error.message}`);
  return data.id;
}

async function upsertServicios(proveedorId, servicios) {
  await supabase.from("proveedor_servicios").delete().eq("proveedor_id", proveedorId);
  if (servicios.length === 0) return;

  const rows = servicios.map((s, idx) => ({
    proveedor_id: proveedorId,
    nombre: s.nombre,
    descripcion: s.descripcion,
    categoria: s.categoria,
    precio_desde_clp: s.precio_desde_clp ?? null,
    activo: true,
    orden: idx,
  }));
  const { error } = await supabase.from("proveedor_servicios").insert(rows);
  if (error) throw new Error(`insert servicios: ${error.message}`);
}

async function upsertMedios(proveedorId, urls) {
  await supabase.from("proveedor_medios").delete().eq("proveedor_id", proveedorId);
  if (urls.length === 0) return;

  const rows = urls.map((url, idx) => ({
    proveedor_id: proveedorId,
    tipo: "imagen",
    storage_path: `_seed/${proveedorId}/${idx}.jpg`,
    url_publica: url,
    alt: null,
    orden: idx,
  }));
  const { error } = await supabase.from("proveedor_medios").insert(rows);
  if (error) throw new Error(`insert medios: ${error.message}`);
}

async function main() {
  console.log("→ Seeding 5 proveedores dummy…\n");

  for (const spec of PROVEEDORES) {
    console.log(`· ${spec.nombre_negocio} (${spec.email})`);
    try {
      const userId = await asegurarUser(spec.email);
      const proveedorId = await upsertProveedor(userId, spec);
      await upsertServicios(proveedorId, spec.servicios);
      await upsertMedios(proveedorId, spec.medios);
      console.log(`  ✓ proveedor ${proveedorId}  · servicios ${spec.servicios.length}  · medios ${spec.medios.length}`);
    } catch (err) {
      console.error(`  ✗ ${err.message}`);
    }
  }

  console.log("\n→ Listo. Password para todos los dummies: " + PASSWORD);
  console.log("→ Verificar en /marketplace que aparezcan los 5.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
