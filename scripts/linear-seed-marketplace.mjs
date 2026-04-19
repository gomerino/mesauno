#!/usr/bin/env node
/**
 * Linear seed — Marketplace (Semana 3+).
 *
 * Crea:
 *  - Cycle "Semana 3 — Marketplace MVP" (2026-04-27 → 2026-05-03).
 *  - Labels nuevos: marketplace, epic, supply, demand (+ reutiliza existentes).
 *  - 3 épicas (Discovery v1, Agenda & Request, Payments & Trust).
 *  - 14 HUs (M1–M14) con parentId apuntando a la épica correspondiente.
 *  - M1–M8 (Discovery v1) asignadas al cycle Semana 3.
 *  - M9–M14 quedan en Backlog sin cycle.
 *
 * Idempotente: reutiliza labels/cycles/issues por nombre/título.
 *
 * Uso:  node scripts/linear-seed-marketplace.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const API_KEY = process.env.LINEAR_API_KEY;
const TEAM_ID = process.env.LINEAR_TEAM_ID;
if (!API_KEY) throw new Error("Falta LINEAR_API_KEY en .env.local");
if (!TEAM_ID) throw new Error("Falta LINEAR_TEAM_ID en .env.local");

const ENDPOINT = "https://api.linear.app/graphql";

async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: API_KEY },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error("Linear error: " + JSON.stringify(json.errors));
  return json.data;
}

async function getTeamContext() {
  const data = await gql(
    `
    query($id: String!) {
      team(id: $id) {
        id key name
        states { nodes { id name type } }
        labels { nodes { id name } }
        cycles { nodes { id name startsAt endsAt } }
      }
    }
  `,
    { id: TEAM_ID },
  );
  return data.team;
}

async function ensureLabel(existing, name, color) {
  const hit = existing.find((l) => l.name.toLowerCase() === name.toLowerCase());
  if (hit) return hit.id;
  const data = await gql(
    `
    mutation($name: String!, $color: String!, $teamId: String!) {
      issueLabelCreate(input: { name: $name, color: $color, teamId: $teamId }) {
        success
        issueLabel { id name }
      }
    }
  `,
    { name, color, teamId: TEAM_ID },
  );
  return data.issueLabelCreate.issueLabel.id;
}

async function listAllIssueTitles() {
  const titles = new Map();
  let after = null;
  for (let i = 0; i < 20; i++) {
    const data = await gql(
      `
      query($teamId: ID!, $after: String) {
        issues(first: 100, after: $after, filter: { team: { id: { eq: $teamId } } }) {
          pageInfo { hasNextPage endCursor }
          nodes { id identifier title url parent { id } }
        }
      }
    `,
      { teamId: TEAM_ID, after },
    );
    for (const n of data.issues.nodes) titles.set(n.title, n);
    if (!data.issues.pageInfo.hasNextPage) break;
    after = data.issues.pageInfo.endCursor;
  }
  return titles;
}

async function createIssueIfMissing(existing, payload) {
  const hit = existing.get(payload.title);
  if (hit) return { ...hit, reused: true };
  const data = await gql(
    `
    mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier title url }
      }
    }
  `,
    { input: payload },
  );
  const issue = data.issueCreate.issue;
  existing.set(issue.title, issue);
  return { ...issue, reused: false };
}

async function ensureCycle(existingCycles, name, startsAt, endsAt) {
  const hit = existingCycles.find((c) => c.name === name);
  if (hit) return hit;
  const data = await gql(
    `
    mutation($input: CycleCreateInput!) {
      cycleCreate(input: $input) {
        success
        cycle { id name startsAt endsAt }
      }
    }
  `,
    { input: { teamId: TEAM_ID, name, startsAt, endsAt } },
  );
  return data.cycleCreate.cycle;
}

async function assignIssueToCycle(issueId, cycleId) {
  await gql(
    `
    mutation($id: String!, $cycleId: String!) {
      issueUpdate(id: $id, input: { cycleId: $cycleId }) { success }
    }
  `,
    { id: issueId, cycleId },
  );
}

async function assignIssueParent(issueId, parentId) {
  await gql(
    `
    mutation($id: String!, $parentId: String!) {
      issueUpdate(id: $id, input: { parentId: $parentId }) { success }
    }
  `,
    { id: issueId, parentId },
  );
}

function desc(parts) {
  return parts.join("\n");
}

const LABEL_SPEC = [
  ["marketplace", "#D4AF37"],
  ["epic", "#8B5CF6"],
  ["supply", "#0EA5E9"],
  ["demand", "#10B981"],
  ["p0", "#EF4444"],
  ["p1", "#F97316"],
  ["p2", "#F59E0B"],
  ["ux", "#EC4899"],
  ["tech", "#6366F1"],
  ["analytics", "#10B981"],
  ["qa", "#14B8A6"],
  ["monetizacion", "#D4AF37"],
];

const EPICS = [
  {
    key: "EPIC-MKT-V1",
    title: "EPIC · Marketplace Discovery v1 (MVP)",
    priority: 1,
    labels: ["marketplace", "epic", "p0"],
    children: ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8"],
    description: desc([
      "## Objetivo",
      "Lanzar el marketplace de proveedores con discovery + contacto directo. Es la primera versión del lado marketplace del producto.",
      "",
      "## Scope",
      "- Modelo de datos real para providers, services, media, leads, wishlist.",
      "- Onboarding self-serve con review manual (SLA 48h).",
      "- Panel proveedor v1 para mantener perfil vivo.",
      "- Listado /marketplace rediseñado (gold-navy premium).",
      "- Detalle /marketplace/[slug] con portfolio + CTA contacto.",
      "- Flujo de contacto con tracking (lead) y caps free/premium.",
      "- Wishlist novio (agregar a mi evento).",
      "- Search & filters v2 (texto libre + filtros avanzados).",
      "",
      "## Monetización MVP",
      "- Free: perfil + 3 leads/mes + 6 fotos.",
      "- Premium ($29.990 CLP/mes): destacado, leads ilimitados, portfolio ilimitado, analytics.",
      "- Checkout de premium queda en fase 2 (M12); en MVP se captura interés vía email.",
      "",
      "## DoD épica",
      "- 20+ proveedores aprobados en producción.",
      "- Al menos 10 leads reales enviados en primeras 2 semanas.",
      "- `MARKETPLACE_V1=true` en prod.",
      "- Workflows completos en `/workflows/M01–M08`.",
      "",
      "## KPIs core",
      "- `active_providers` ≥ 20",
      "- `lead_submitted_rate` (card → lead) ≥ 4%",
      "- `time_to_first_lead_h` p50 ≤ 72h",
      "",
      "## Contiene",
      "M1 · M2 · M3 · M4 · M5 · M6 · M7 · M8",
    ]),
  },
  {
    key: "EPIC-MKT-V2",
    title: "EPIC · Marketplace Agenda & Request v2",
    priority: 2,
    labels: ["marketplace", "epic", "p1"],
    children: ["M9", "M10", "M11"],
    description: desc([
      "## Objetivo",
      "Evolucionar de contacto a reserva. El novio puede ver disponibilidad del provider y solicitar reserva con fecha.",
      "",
      "## Scope",
      "- Agenda del proveedor con reglas de disponibilidad (basado en HU-001 ya diseñada).",
      "- Booking request flow: novio pide reserva con fecha concreta.",
      "- Inbox in-app proveedor ↔ novio (ya no solo WhatsApp out-of-band).",
      "",
      "## Prerequisito",
      "- EPIC Discovery v1 en prod y estable.",
      "- Supply ≥ 30 proveedores.",
      "- Al menos 50 leads enviados con demanda demostrada.",
      "",
      "## Contiene",
      "M9 · M10 · M11",
    ]),
  },
  {
    key: "EPIC-MKT-V3",
    title: "EPIC · Marketplace Payments & Trust v3",
    priority: 3,
    labels: ["marketplace", "epic", "p2"],
    children: ["M12", "M13", "M14"],
    description: desc([
      "## Objetivo",
      "Cerrar el loop económico dentro de la plataforma: cobros al proveedor (Premium self-serve), anticipo entre novio y proveedor, y reviews post-evento como social proof.",
      "",
      "## Scope",
      "- Self-serve checkout plan Premium provider (Mercado Pago suscripciones).",
      "- Anticipo/señal opcional in-app para booking confirmado (escrow light).",
      "- Reviews post-evento con fotos opcionales.",
      "",
      "## Prerequisito",
      "- EPIC v2 validada.",
      "- Retention provider D30 ≥ 60%.",
      "- Intent premium demostrado (≥ 10% CTR upgrade).",
      "",
      "## Contiene",
      "M12 · M13 · M14",
    ]),
  },
];

const HUS = [
  // ── Epic 1: Discovery v1 ────────────────────────────────────────────
  {
    key: "M1",
    title: "M1 — Modelo de datos real (providers, services, media, leads)",
    parentKey: "EPIC-MKT-V1",
    priority: 1,
    state: "Todo",
    cycle: "week3",
    labels: ["marketplace", "supply", "tech", "p0"],
    description: desc([
      "## User story",
      "Como plataforma, quiero un modelo relacional real para providers, services, media, leads y wishlist, para reemplazar `marketplace_servicios` y habilitar onboarding, contacto y analytics.",
      "",
      "## Workflow",
      "`/workflows/M01-providers-schema/` — hu, ux, data, tech, qa, growth, validation.",
      "",
      "## Resumen scope",
      "- Tablas: providers, provider_services, provider_media, provider_leads, provider_wishlist.",
      "- RLS + storage bucket `provider-media`.",
      "- Tipos TS + helpers en `src/lib/providers/`.",
      "- Migración forward + rollback documentado.",
      "",
      "## DoD",
      "- Migration corre en staging sin errores.",
      "- Q1–Q14 passed (ver qa.md).",
      "- Tipos TS compilan; no breaking.",
      "",
      "## Bloquea",
      "M2, M3, M4, M5, M6, M7, M8.",
    ]),
  },
  {
    key: "M2",
    title: "M2 — Onboarding self-serve + review manual (proveedor)",
    parentKey: "EPIC-MKT-V1",
    priority: 1,
    state: "Todo",
    cycle: "week3",
    labels: ["marketplace", "supply", "ux", "p0"],
    description: desc([
      "## User story",
      "Como proveedor, quiero registrarme en Jurnex creando mi perfil paso a paso, para aparecer en el marketplace y recibir contactos tras una revisión manual que me da confianza.",
      "",
      "## Workflow",
      "`/workflows/M02-provider-onboarding/`.",
      "",
      "## Resumen scope",
      "- Landing `/para-proveedores` + stepper 3 pasos.",
      "- Row provider pending + fotos iniciales + slug auto.",
      "- Admin `/admin/providers` (allowlist env) con approve/suspend.",
      "- Emails transaccionales (bienvenida, aprobado, suspendido).",
      "- SLA 48h aprobación.",
      "",
      "## DoD",
      "- 5 providers reales en beta aprobados.",
      "- Q1–Q14 passed (ver qa.md).",
      "",
      "## Depende de",
      "M1.",
    ]),
  },
  {
    key: "M3",
    title: "M3 — Panel proveedor v1 (perfil, servicios, media, leads)",
    parentKey: "EPIC-MKT-V1",
    priority: 1,
    state: "Todo",
    cycle: "week3",
    labels: ["marketplace", "supply", "ux", "p0"],
    description: desc([
      "## User story",
      "Como proveedor aprobado, quiero un panel donde editar mi perfil, servicios y fotos, y ver mis leads, para mantener mi info viva y responder rápido.",
      "",
      "## Workflow",
      "`/workflows/M03-provider-panel-v1/`.",
      "",
      "## Resumen scope",
      "- `/provider` con tabs Perfil · Servicios · Fotos · Solicitudes · Plan.",
      "- Auto-save on blur.",
      "- CRUD servicios con reorder.",
      "- Gallery con cap según plan.",
      "- Lista leads con filtros y deep-link a WhatsApp.",
      "",
      "## DoD",
      "- 70% providers approved loggean al menos 1 vez en 7 días (post-launch).",
      "- Q1–Q16 passed.",
      "",
      "## Depende de",
      "M1, M2.",
    ]),
  },
  {
    key: "M4",
    title: "M4 — Rediseño del listado /marketplace (gold-navy premium)",
    parentKey: "EPIC-MKT-V1",
    priority: 1,
    state: "Todo",
    cycle: "week3",
    labels: ["marketplace", "demand", "ux", "p0"],
    description: desc([
      "## User story",
      "Como novio/a, quiero un marketplace premium donde descubrir proveedores por categoría, región y estilo, para armar mi equipo con confianza.",
      "",
      "## Workflow",
      "`/workflows/M04-marketplace-listing-redesign/`.",
      "",
      "## Resumen scope",
      "- UI navy + gold coherente con BoardingPass.",
      "- Filtros: categoría (chips), región, precio, orden.",
      "- Cards con foto destacada, badge Premium, precio desde.",
      "- Paginación / infinite scroll.",
      "- SEO: title dinámico, sitemap, Open Graph.",
      "",
      "## DoD",
      "- CTR card ≥ 15%.",
      "- Lighthouse mobile ≥ 85.",
      "- Q1–Q15 passed.",
      "",
      "## Depende de",
      "M1. Paralelo con M5.",
    ]),
  },
  {
    key: "M5",
    title: "M5 — Página detalle /marketplace/[slug]",
    parentKey: "EPIC-MKT-V1",
    priority: 1,
    state: "Todo",
    cycle: "week3",
    labels: ["marketplace", "demand", "ux", "p0"],
    description: desc([
      "## User story",
      "Como novio/a evaluando proveedores, quiero una página detalle rica con portfolio, servicios y contacto directo, para decidir con confianza.",
      "",
      "## Workflow",
      "`/workflows/M05-provider-detail-page/`.",
      "",
      "## Resumen scope",
      "- Hero + portfolio lightbox + bio + servicios + contacto.",
      "- Sticky CTA mobile.",
      "- SEO: JSON-LD LocalBusiness, OG, sitemap.",
      "- Wishlist integration.",
      "",
      "## DoD",
      "- Contact conversion ≥ 8% (CTA click / provider_viewed).",
      "- JSON-LD valida sin errores.",
      "- Q1–Q17 passed.",
      "",
      "## Depende de",
      "M1. Paralelo con M4.",
    ]),
  },
  {
    key: "M6",
    title: "M6 — Flujo de contacto novio → proveedor (lead tracking)",
    parentKey: "EPIC-MKT-V1",
    priority: 1,
    state: "Todo",
    cycle: "week3",
    labels: ["marketplace", "demand", "tech", "analytics", "p0"],
    description: desc([
      "## User story",
      "Como novio/a, quiero solicitar contacto a un proveedor con el contexto de mi evento, para recibir una respuesta rápida y relevante.",
      "",
      "## Workflow",
      "`/workflows/M06-lead-contact-flow/`.",
      "",
      "## Resumen scope",
      "- Modal LeadModal con pre-fill evento.",
      "- Auth inline si no logueado.",
      "- Rate limit (5/día global; 1/provider/canal/día vía UNIQUE).",
      "- Plan cap free (3 leads/mes): lead se crea, provider no notificado, novio ve \"similares\".",
      "- Emails a provider + copia al novio.",
      "- CTA post-submit: abrir WhatsApp directo.",
      "",
      "## DoD",
      "- Submit rate ≥ 60% (modal → submit).",
      "- 0 leads duplicados.",
      "- Q1–Q17 passed.",
      "",
      "## Depende de",
      "M1, M2 (provider con datos), M5 (CTA entry).",
    ]),
  },
  {
    key: "M7",
    title: "M7 — Wishlist novio (agregar proveedor a mi evento)",
    parentKey: "EPIC-MKT-V1",
    priority: 2,
    state: "Todo",
    cycle: "week3",
    labels: ["marketplace", "demand", "ux", "p1"],
    description: desc([
      "## User story",
      "Como novio/a, quiero marcar proveedores como \"en mi equipo de evento\", para volver a ellos después y compararlos con mi pareja/familia.",
      "",
      "## Scope",
      "- Corazón en card (M04) + detalle (M05).",
      "- Vista `/panel/equipo` integrada al journey — lista providers/servicios guardados.",
      "- Idempotente (unique constraint M1).",
      "- Requiere auth con evento.",
      "",
      "## DoD",
      "- Wishlist rate ≥ 10% de provider_viewed.",
      "- Sin duplicados (UNIQUE funciona).",
      "- Correlación wishlist → lead en 14d medible.",
      "",
      "## Depende de",
      "M1, M4, M5.",
      "",
      "## No incluye",
      "- Notas por item (post-MVP).",
      "- Compartir wishlist con pareja (post-MVP).",
    ]),
  },
  {
    key: "M8",
    title: "M8 — Search & filters v2 (texto libre + avanzados)",
    parentKey: "EPIC-MKT-V1",
    priority: 2,
    state: "Backlog",
    cycle: null,
    labels: ["marketplace", "demand", "ux", "p1"],
    description: desc([
      "## User story",
      "Como novio/a, quiero buscar por texto libre (ej. \"fotógrafo bohemio en Valparaíso\") y filtrar por estilo/capacidad, para encontrar proveedores que hacen match con mi visión.",
      "",
      "## Scope",
      "- Búsqueda full-text en `providers.business_name`, `tagline`, `bio`.",
      "- Filtros adicionales: tags estilísticos (bohemio, clásico, moderno), capacidad (solo `lugar`).",
      "- Sugerencias autocomplete.",
      "- Guardar búsqueda (logged-in).",
      "",
      "## DoD",
      "- Search usage ≥ 25% de sesiones marketplace.",
      "- Zero-result rate < 15%.",
      "",
      "## Depende de",
      "M1 (agregar columnas tags/capacity), M4.",
    ]),
  },
  // ── Epic 2: Agenda & Request v2 ────────────────────────────────────
  {
    key: "M9",
    title: "M9 — Agenda del proveedor (availability)",
    parentKey: "EPIC-MKT-V2",
    priority: 2,
    state: "Backlog",
    cycle: null,
    labels: ["marketplace", "supply", "tech", "p1"],
    description: desc([
      "## User story",
      "Como proveedor, quiero declarar mi disponibilidad (días, rangos horarios, días bloqueados) para que los novios vean cuándo pueden reservarme.",
      "",
      "## Referencia",
      "Existe `/workflows/HU-001-agenda-proveedor/` diseñada previamente. Reutilizar ese material + adaptar a nuestro schema M1.",
      "",
      "## Scope",
      "- Tabla `provider_availability` (rules + exceptions).",
      "- UI en `/provider/agenda` con calendar view.",
      "- Respuesta \"disponible para esta fecha\" en detalle provider (M5).",
      "",
      "## Depende de",
      "M1, M3. EPIC v1 en prod estable.",
    ]),
  },
  {
    key: "M10",
    title: "M10 — Booking request flow (reserva con fecha)",
    parentKey: "EPIC-MKT-V2",
    priority: 2,
    state: "Backlog",
    cycle: null,
    labels: ["marketplace", "demand", "tech", "p1"],
    description: desc([
      "## User story",
      "Como novio/a, quiero solicitar una reserva concreta con fecha y servicio, y recibir confirmación del proveedor, para avanzar del lead al booking.",
      "",
      "## Scope",
      "- Tabla `bookings` (pending → confirmed → cancelled).",
      "- UI solicitud desde M5 con fecha desde agenda M9.",
      "- Provider puede confirmar/rechazar desde panel (M3 extension).",
      "- Notificaciones email bidireccionales.",
      "",
      "## Depende de",
      "M9. Extiende M3 y M5.",
    ]),
  },
  {
    key: "M11",
    title: "M11 — Inbox in-app proveedor ↔ novio",
    parentKey: "EPIC-MKT-V2",
    priority: 2,
    state: "Backlog",
    cycle: null,
    labels: ["marketplace", "ux", "tech", "p1"],
    description: desc([
      "## User story",
      "Como novio/a y proveedor, quiero conversar dentro de Jurnex con historial persistente, para que el contexto no se pierda en WhatsApp.",
      "",
      "## Scope",
      "- Tabla `messages` asociada a lead/booking.",
      "- UI inbox en `/provider/solicitudes/:id` y `/panel/equipo/proveedor/:id`.",
      "- Notificaciones email con thread.",
      "",
      "## Depende de",
      "M6. Útil complementar con M10.",
      "",
      "## KPI",
      "- Response rate provider ≤ 24h.",
      "- Migration de conversaciones: 20%+ usa inbox vs WhatsApp primario.",
    ]),
  },
  // ── Epic 3: Payments & Trust v3 ────────────────────────────────────
  {
    key: "M12",
    title: "M12 — Plan Premium self-checkout (provider)",
    parentKey: "EPIC-MKT-V3",
    priority: 3,
    state: "Backlog",
    cycle: null,
    labels: ["marketplace", "supply", "monetizacion", "p2"],
    description: desc([
      "## User story",
      "Como proveedor interesado en plan Premium, quiero pagar la suscripción directamente desde `/provider/plan`, para activarlo sin fricción.",
      "",
      "## Scope",
      "- Integración Mercado Pago Subscripciones.",
      "- `provider.plan = 'premium'` via webhook.",
      "- Cancelación self-serve.",
      "- Billing history.",
      "",
      "## Depende de",
      "EPIC v2 (retención demostrada).",
      "",
      "## KPI",
      "- Free → Premium conversion ≥ 3%.",
    ]),
  },
  {
    key: "M13",
    title: "M13 — Anticipo/señal in-app (novio → proveedor)",
    parentKey: "EPIC-MKT-V3",
    priority: 3,
    state: "Backlog",
    cycle: null,
    labels: ["marketplace", "monetizacion", "tech", "p2"],
    description: desc([
      "## User story",
      "Como novio/a, quiero pagar un anticipo/señal al proveedor a través de Jurnex, para confirmar la reserva con protección mínima.",
      "",
      "## Scope",
      "- Escrow light: Jurnex retiene anticipo hasta evento confirmado.",
      "- Integración Mercado Pago marketplace.",
      "- Disputes/cancelation policy documentada.",
      "- Take rate: 3-5% (decisión previa al desarrollo).",
      "",
      "## Depende de",
      "M10, M12. Legal review requerida.",
    ]),
  },
  {
    key: "M14",
    title: "M14 — Reviews post-evento",
    parentKey: "EPIC-MKT-V3",
    priority: 3,
    state: "Backlog",
    cycle: null,
    labels: ["marketplace", "demand", "ux", "p2"],
    description: desc([
      "## User story",
      "Como novio/a, quiero dejar reseña a los proveedores de mi evento tras la boda, para ayudar a otros novios y generar social proof.",
      "",
      "## Scope",
      "- Tabla `reviews` (rating 1-5, comentario, fotos opcionales).",
      "- Solo reviewable tras `bookings.status = completed` y fecha evento pasada.",
      "- Moderación manual inicial.",
      "- Display en M5 + badge reviews destacados.",
      "",
      "## Depende de",
      "M10.",
      "",
      "## KPI",
      "- Review submit rate post-evento ≥ 30%.",
    ]),
  },
];

async function main() {
  console.log("→ Obteniendo contexto del team…");
  const team = await getTeamContext();
  const stateByName = new Map(team.states.nodes.map((s) => [s.name, s.id]));
  if (!stateByName.get("Todo") || !stateByName.get("Backlog")) {
    throw new Error("Estados Todo/Backlog no encontrados en el team");
  }

  console.log("→ Asegurando labels…");
  const labelIdByName = new Map();
  const labelsNow = [...team.labels.nodes];
  for (const [name, color] of LABEL_SPEC) {
    const id = await ensureLabel(labelsNow, name, color);
    labelIdByName.set(name, id);
    if (!labelsNow.find((l) => l.id === id)) labelsNow.push({ id, name });
  }

  console.log("→ Asegurando cycle 'Semana 3 — Marketplace MVP'…");
  const cycleWeek3 = await ensureCycle(
    team.cycles.nodes,
    "Semana 3 — Marketplace MVP",
    "2026-04-27T00:00:00.000Z",
    "2026-05-03T23:59:59.000Z",
  );

  console.log("→ Leyendo issues existentes…");
  const existing = await listAllIssueTitles();

  const issueByKey = new Map();

  // 1) Crear épicas primero (sin parent)
  console.log("\n→ Creando épicas…");
  for (const epic of EPICS) {
    const labelIds = epic.labels.map((n) => labelIdByName.get(n)).filter(Boolean);
    const payload = {
      teamId: TEAM_ID,
      title: epic.title,
      description: epic.description,
      priority: epic.priority,
      stateId: stateByName.get("Backlog"),
      labelIds,
    };
    const issue = await createIssueIfMissing(existing, payload);
    issueByKey.set(epic.key, issue);
    const tag = issue.reused ? "(reusado)" : "(nuevo)";
    console.log(`  ${issue.identifier}  ${tag}  ${issue.title}`);
  }

  // 2) Crear HUs con parent
  console.log("\n→ Creando HUs…");
  for (const hu of HUS) {
    const parent = issueByKey.get(hu.parentKey);
    if (!parent) {
      console.warn(`  [WARN] Sin parent para ${hu.key} (${hu.parentKey}) — creando sin parent`);
    }
    const labelIds = hu.labels.map((n) => labelIdByName.get(n)).filter(Boolean);
    const payload = {
      teamId: TEAM_ID,
      title: hu.title,
      description: hu.description,
      priority: hu.priority,
      stateId: stateByName.get(hu.state),
      labelIds,
    };
    if (parent) payload.parentId = parent.id;
    const issue = await createIssueIfMissing(existing, payload);
    issueByKey.set(hu.key, issue);
    const tag = issue.reused ? "(reusado)" : "(nuevo)";
    console.log(`  ${issue.identifier}  ${tag}  ${issue.title}`);

    // Si ya existía sin parent, fixear parent
    if (issue.reused && parent && (!issue.parent || issue.parent.id !== parent.id)) {
      await assignIssueParent(issue.id, parent.id);
      console.log(`    └── parent → ${parent.identifier}`);
    }

    // Cycle assignment
    if (hu.cycle === "week3") {
      await assignIssueToCycle(issue.id, cycleWeek3.id);
      console.log(`    └── cycle → ${cycleWeek3.name}`);
    }
  }

  console.log("\n=== Resumen ===");
  console.log(`Cycle: ${cycleWeek3.name} (${cycleWeek3.id})`);
  console.log(`\nÉpicas:`);
  for (const e of EPICS) {
    const i = issueByKey.get(e.key);
    console.log(`  ${i.identifier}  ${i.url}`);
  }
  console.log(`\nHUs Discovery v1 (Semana 3):`);
  for (const h of HUS.filter((x) => x.parentKey === "EPIC-MKT-V1")) {
    const i = issueByKey.get(h.key);
    console.log(`  ${i.identifier}  ${i.url}  (${h.state}${h.cycle === "week3" ? " + cycle" : ""})`);
  }
  console.log(`\nHUs Agenda v2 (Backlog):`);
  for (const h of HUS.filter((x) => x.parentKey === "EPIC-MKT-V2")) {
    const i = issueByKey.get(h.key);
    console.log(`  ${i.identifier}  ${i.url}`);
  }
  console.log(`\nHUs Payments v3 (Backlog):`);
  for (const h of HUS.filter((x) => x.parentKey === "EPIC-MKT-V3")) {
    const i = issueByKey.get(h.key);
    console.log(`  ${i.identifier}  ${i.url}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
