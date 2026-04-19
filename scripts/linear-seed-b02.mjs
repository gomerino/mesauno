#!/usr/bin/env node
/**
 * Crea issues B02 (viaje por fase) + spikes técnicos/producto en Linear.
 * Idempotente: no duplica por título exacto.
 *
 * Uso: node scripts/linear-seed-b02.mjs
 *
 * Workflow: workflows/B02-viaje-modulos-por-fase/
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
    `query($id: String!) {
      team(id: $id) {
        id
        states { nodes { id name type } }
        labels { nodes { id name } }
      }
    }`,
    { id: TEAM_ID },
  );
  return data.team;
}

async function listAllIssueTitles() {
  const titles = new Map();
  let after = null;
  for (let i = 0; i < 15; i++) {
    const data = await gql(
      `query($teamId: ID!, $after: String) {
        issues(first: 100, after: $after, filter: { team: { id: { eq: $teamId } } }) {
          pageInfo { hasNextPage endCursor }
          nodes { id identifier title }
        }
      }`,
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
    `mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier title url }
      }
    }`,
    { input: payload },
  );
  const issue = data.issueCreate.issue;
  existing.set(issue.title, issue);
  return { ...issue, reused: false };
}

function desc(lines) {
  return lines.join("\n");
}

const WF = "`workflows/B02-viaje-modulos-por-fase/`";

const ISSUES = [
  {
    title: "B02 — Épica: módulos del viaje por fase (check-in / despegue / en vuelo)",
    priority: 2,
    state: "Backlog",
    labels: ["epic", "panel", "p1"],
    description: desc([
      "## Objetivo",
      "Redefinir qué ve la pareja en cada tiempo del viaje: tarjetas y rutas alineadas a trabajo real (invitaciones, preview, programa, Spotify, hub día-D).",
      "",
      "## Fuente",
      WF + " `hu.md`, `revision-por-roles.md`, `tech.md`.",
      "",
      "## Alcance",
      "- Check-in: Evento, Pasajeros, **Invitaciones** (bulk correo, honestidad WhatsApp, preview).",
      "- Despegue: **Programa** + **Experiencia** (Spotify).",
      "- En vuelo: **programa interactivo** como hub único (fotos/música/interacción desde ahí).",
      "",
      "## Regla de repo",
      "No editar `/invitacion/*` público sin HU aparte.",
      "",
      "## Hijos",
      "Spikes S1–S3; historias B02-01 … B02-05 (mismo prefijo en títulos).",
    ]),
  },
  {
    title: "SPIKE B02-S1 — Spotify: scopes OAuth, búsqueda, playlist y votos (viabilidad)",
    priority: 1,
    state: "Backlog",
    labels: ["tech", "panel", "p1"],
    description: desc([
      "## Tipo",
      "Spike técnico (time-box sugerido: 2–3 días).",
      "",
      "## Preguntas a cerrar",
      "- ¿Qué scopes tiene el refresh actual y qué falta para búsqueda de tracks y escritura en playlist?",
      "- ¿Playlist propia vs colaborativa vs solo lectura? Implicancias de cuota y UX.",
      "- Modelo mínimo para **votos/sugerencias** (tabla en DB, job que aplica a playlist) vs solo UI.",
      "- Rate limits y manejo de token expirado en día del evento.",
      "",
      "## Entregables",
      "- Doc corto en " + WF + " o comentario en este issue: decisión MVP vs fase 2.",
      "- Lista de tareas para **B02-04**.",
      "",
      "## Código de referencia",
      "`src/app/panel/actions/spotify.ts`, `src/app/api/spotify/*`, tabla `evento_spotify`, `ExperienciaPageClient`.",
    ]),
  },
  {
    title: "SPIKE B02-S2 — Fotos ↔ programa del día: reglas de asociación y moderación mínima",
    priority: 1,
    state: "Backlog",
    labels: ["tech", "panel", "p1", "ux"],
    description: desc([
      "## Tipo",
      "Spike producto+técnico (time-box sugerido: 2–3 días).",
      "",
      "## Preguntas a cerrar",
      "- Asociar fotos por **hora de subida** vs **EXIF DateTimeOriginal** vs **ventana alrededor del hito** vs **manual**.",
      "- ¿Un solo álbum o buckets por hito? Impacto en storage y consultas.",
      "- Interacción (reacciones/mensajes): ¿necesario para v0? Riesgo moderación y RLS.",
      "",
      "## Entregables",
      "- Recomendación v0 + criterios de aceptación para **B02-05**.",
      "- Esquema SQL borrador (sin merge hasta HU) si aplica.",
      "",
      "## Referencia",
      WF + " `tech.md` (sección fotos ↔ programa).",
    ]),
  },
  {
    title: "SPIKE B02-S3 — WhatsApp masivo: opciones (Cloud API / BSP) vs deep link 1:1",
    priority: 1,
    state: "Backlog",
    labels: ["tech", "ux", "p1"],
    description: desc([
      "## Tipo",
      "Spike descubrimiento (time-box sugerido: 1–2 días).",
      "",
      "## Contexto hoy",
      "`WhatsAppInviteButton`: wa.me por invitado; **no** hay broadcast server-side en repo.",
      "",
      "## Preguntas a cerrar",
      "- Meta Cloud API vs proveedor BSP: costo, verificación negocio, plantillas, opt-in.",
      "- Qué puede prometer la UI en 2026 vs roadmap.",
      "- Si conviene ticket hijo legal/compliance (mínimo checklist).",
      "",
      "## Entregables",
      "Texto fuente de verdad para copy y para **B02-03** (documentación producto).",
    ]),
  },
  {
    title: "B02-01 — Check-in: superficie «Invitaciones» en home (hub)",
    priority: 2,
    state: "Backlog",
    labels: ["panel", "invitados", "ux", "p1"],
    description: desc([
      "## Historia",
      "Como pareja en preparativos quiero una tarjeta o bloque que agrupe envío masivo, WhatsApp y vista previa para no saltar sin contexto.",
      "",
      "## Alcance",
      "- Enlaces claros a bulk correo, preview (`/panel/invitados/vista`), WhatsApp con copy honesto (ver B02-S3).",
      "- Tracking sin PII (`panel_phase_clicked` / eventos en `data.md`).",
      "",
      "## Dependencias",
      "Recomendable tras **B02-S3** para copy; puede avanzar en paralelo con UI placeholder.",
      "",
      "## Referencia",
      WF + " `hu.md` (B02-01), `ux.md`.",
    ]),
  },
  {
    title: "B02-02 — Envío masivo correo: límites Resend, reintentos y estados fallidos",
    priority: 2,
    state: "Backlog",
    labels: ["panel", "invitados", "tech", "p1"],
    description: desc([
      "## Objetivo",
      "Transparencia operativa: no prometer «masivo» sin límites visibles ni manejo de fallos.",
      "",
      "## Alcance",
      "- Revisar `runBulkInvitationSend` y Resend: rate, reintentos, idempotencia por invitado.",
      "- UI o panel de estado: enviado / fallido / pendiente (sin PII en analytics).",
      "",
      "## Referencia",
      WF + " `hu.md` (B02-02), `revision-por-roles.md` (Tech).",
    ]),
  },
  {
    title: "B02-03 — WhatsApp: documentación producto (hoy 1:1 vs roadmap API)",
    priority: 3,
    state: "Backlog",
    labels: ["invitados", "ux", "p2"],
    description: desc([
      "## Objetivo",
      "Una fuente interna + copy de UI alineados: qué existe hoy vs qué es roadmap.",
      "",
      "## Dependencias",
      "Salida de **B02-S3**.",
      "",
      "## Referencia",
      WF + " `hu.md` (B02-03).",
    ]),
  },
  {
    title: "B02-04 — Despegue: experiencia Spotify (búsqueda, playlist, votos según viabilidad)",
    priority: 2,
    state: "Backlog",
    labels: ["panel", "tech", "p1"],
    description: desc([
      "## Objetivo",
      "Cerrar promesa «Ambiente del viaje»: flujo conectado a Spotify según decisión del spike S1.",
      "",
      "## Dependencias",
      "**B02-S1** cerrado (o criterios MVP explícitos en comentario).",
      "",
      "## Referencia",
      WF + " `hu.md` (B02-04), `ExperienciaPageClient`.",
    ]),
  },
  {
    title: "B02-05 — En vuelo: programa interactivo como hub único (fotos + música + interacción)",
    priority: 2,
    state: "Backlog",
    labels: ["panel", "ux", "p1"],
    description: desc([
      "## Objetivo",
      "Un solo lugar día-D: programa + contenido vivo; resto de interacción desde ahí.",
      "",
      "## Dependencias",
      "**B02-S2** (reglas fotos↔programa y alcance interacción).",
      "",
      "## Referencia",
      WF + " `hu.md` (B02-05), `ux.md` (hub en vuelo).",
    ]),
  },
];

async function main() {
  console.log("→ Linear: B02 viaje por fase + spikes…");
  const team = await getTeamContext();
  const stateByName = new Map(team.states.nodes.map((s) => [s.name, s.id]));
  const labelIdByName = new Map(team.labels.nodes.map((l) => [l.name.toLowerCase(), l.id]));

  const backlogId = stateByName.get("Backlog");
  if (!backlogId) throw new Error("No encontré estado Backlog en el team");

  const existing = await listAllIssueTitles();
  const created = [];
  const reused = [];

  for (const spec of ISSUES) {
    const stateId = stateByName.get(spec.state) ?? backlogId;
    const labelIds = spec.labels.map((n) => labelIdByName.get(n.toLowerCase())).filter(Boolean);
    const missing = spec.labels.filter((n) => !labelIdByName.get(n.toLowerCase()));
    if (missing.length) {
      console.warn("⚠ Etiquetas omitidas (no existen en Linear):", missing.join(", "));
    }
    const payload = {
      teamId: TEAM_ID,
      title: spec.title,
      description: spec.description,
      priority: spec.priority,
      stateId,
      labelIds,
    };
    const issue = await createIssueIfMissing(existing, payload);
    if (issue.reused) reused.push(issue.identifier ?? issue.title);
    else created.push(issue.identifier ?? issue.title);
  }

  console.log("Creados:", created.length ? created.join(", ") : "(ninguno nuevo)");
  console.log("Ya existían:", reused.length ? reused.join(", ") : "(ninguno)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
