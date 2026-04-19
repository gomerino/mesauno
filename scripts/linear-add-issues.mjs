#!/usr/bin/env node
/**
 * Crea issues adicionales T9/T10/T11 en Linear.
 * Idempotente: reutiliza labels existentes, no duplica issues con mismo título.
 *
 * Uso:  node scripts/linear-add-issues.mjs
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
        id
        key
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
  for (let i = 0; i < 10; i++) {
    const data = await gql(
      `
      query($teamId: ID!, $after: String) {
        issues(first: 100, after: $after, filter: { team: { id: { eq: $teamId } } }) {
          pageInfo { hasNextPage endCursor }
          nodes { id identifier title url }
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

function desc(parts) {
  return parts.join("\n");
}

const NEW_LABELS = [
  ["spike", "#0EA5E9"],
  ["maps", "#22C55E"],
];

const ISSUES = [
  {
    title: "T9 — UX: sheets y cards con altura adaptativa",
    priority: 2,
    state: "Todo",
    labels: ["ux", "mobile", "p1", "panel"],
    cycle: "now",
    description: desc([
      "## Objetivo",
      "Las pantallas de edición y los resúmenes se ajustan al contenido, no al revés.",
      "",
      "## Alcance",
      "- Bottom sheet (`EventoForm`): `h-auto` + `min-h-[40vh]` + `max-h-[85vh]`. Scroll interno sólo si hay overflow.",
      "- Cards de resumen: sin `min-height` implícitos, dejar que el contenido defina alto.",
      "- Revisar InvitadosManager modal y ProgramaHitosManager si aplican el mismo patrón.",
      "- Desktop sin regresiones.",
      "",
      "## DoD",
      "- Editor \"Mensaje\" en mobile ≈ 45-55vh.",
      "- Editor \"Información básica\" en mobile ≈ 70-80vh.",
      "- Card \"Detalles opcionales\" sin espacio en blanco si hay 1 dato.",
      "- Lint + typecheck limpios.",
      "",
      "## Métrica",
      "- `evento_section_saved` rate (menos cancelaciones en bloques cortos).",
      "- tiempo promedio en editor por sección.",
      "",
      "## No incluye",
      "- Rediseño visual de cards.",
      "- Cambios en la lógica de guardado.",
    ]),
  },
  {
    title: "T10 — Spike: elegir proveedor de mapa (Google vs Mapbox)",
    priority: 2,
    state: "Backlog",
    labels: ["tech", "evento", "spike", "maps"],
    description: desc([
      "## Objetivo",
      "Tomar decisión informada antes de integrar validación de dirección.",
      "",
      "## Entregable",
      "- Tabla comparativa: costo real, cobertura LATAM (probar 3 direcciones CL/AR/MX), SDK Next.js, complejidad, restricciones comerciales.",
      "- Mini-POC en branch: autocomplete simple con ambos sobre 1 campo.",
      "- Decisión documentada en la descripción del ticket.",
      "",
      "## DoD",
      "- Proveedor elegido con justificación escrita.",
      "- API key/token configurados en `.env.local`.",
      "- T11 desbloqueado.",
      "",
      "## Opciones a evaluar",
      "- **Google Places Autocomplete + Static Map**: ~$0.017/autocomplete + $0.002/mapa. $200 créditos gratis/mes. Mejor cobertura LATAM.",
      "- **Mapbox + Geocoding**: 100k requests/mes gratis. Setup rápido. Cobertura algo peor en calles secundarias LATAM.",
      "",
      "## No incluye",
      "- Implementación final (eso va en T11).",
    ]),
  },
  {
    title: "T11 — Validar dirección con mapa + mostrar en invitación y panel",
    priority: 2,
    state: "Backlog",
    labels: ["evento", "ux", "tech", "p1", "maps"],
    description: desc([
      "## Depende de",
      "- T10 (elección de proveedor).",
      "",
      "## Objetivo",
      "El organizador ingresa dirección con autocomplete y ve el mapa; el invitado recibe invitación con ubicación precisa y botón \"Abrir en Maps/Waze\".",
      "",
      "## Alcance",
      "- **DB**: agregar columnas opcionales a `eventos`: `destino_lat (numeric)`, `destino_lng (numeric)`, `destino_place_id (text)`, `destino_formatted (text)`.",
      "- **Editor (`EventoForm` → Ubicación)**:",
      "  - Autocomplete en campo \"Dirección\".",
      "  - Al seleccionar, autocompletar \"Nombre del lugar\" si viene del proveedor.",
      "  - Preview de mapa (~180px) bajo los inputs.",
      "  - Guardar lat/lng/place_id/formatted.",
      "- **Invitación pública**: mapa estático con marker + botones \"Abrir en Google Maps\" y \"Abrir en Waze\" (intents universales).",
      "- **Card del panel (Evento)**: mini-thumbnail del mapa cuando hay coords.",
      "- **Fallback**: si el founder pega dirección a mano sin autocomplete, guardar sólo texto y no mostrar mapa (no romper).",
      "",
      "## DoD",
      "- Autocomplete funciona en editor.",
      "- Mapa se guarda y se ve en invitación + panel.",
      "- Invitación abre bien la app nativa de Maps/Waze en mobile.",
      "- Analytics: `address_autocompleted`, `address_validated_with_map`.",
      "- Lint + typecheck limpios. Migración DB aplicada.",
      "",
      "## No incluye",
      "- Edición visual del marker.",
      "- Indicaciones paso-a-paso (rutas).",
      "- Geofencing / notificaciones.",
      "",
      "## Métrica",
      "- % eventos con `destino_lat` no null.",
      "- Tiempo para completar Ubicación.",
    ]),
  },
];

async function main() {
  console.log("→ Contexto del team…");
  const team = await getTeamContext();
  const stateByName = new Map(team.states.nodes.map((s) => [s.name, s.id]));

  console.log("→ Asegurando labels nuevas…");
  const labelsNow = [...team.labels.nodes];
  for (const [name, color] of NEW_LABELS) {
    await ensureLabel(labelsNow, name, color);
  }

  const refreshedTeam = await getTeamContext();
  const labelIdByName = new Map(refreshedTeam.labels.nodes.map((l) => [l.name.toLowerCase(), l.id]));

  const cycleActive = refreshedTeam.cycles.nodes.find((c) => c.name === "Semana 1");
  if (!cycleActive) console.warn("⚠ No encontré cycle 'Semana 1'. T9 se creará sin cycle.");

  console.log("→ Leyendo issues existentes…");
  const existing = await listAllIssueTitles();

  const created = [];
  for (const spec of ISSUES) {
    const stateId = stateByName.get(spec.state);
    if (!stateId) {
      console.log(`· skip: estado ${spec.state} no existe`);
      continue;
    }
    const labelIds = spec.labels
      .map((n) => labelIdByName.get(n.toLowerCase()))
      .filter(Boolean);
    const payload = {
      teamId: TEAM_ID,
      title: spec.title,
      description: spec.description,
      priority: spec.priority,
      stateId,
      labelIds,
    };
    const issue = await createIssueIfMissing(existing, payload);
    if (spec.cycle === "now" && cycleActive) {
      await assignIssueToCycle(issue.id, cycleActive.id);
    }
    created.push({ ...issue, cycle: spec.cycle === "now" ? cycleActive?.name : null });
    console.log(`  ${issue.identifier}  ${issue.reused ? "(reusado)" : "(nuevo)"}  ${issue.title}`);
  }

  console.log("\n=== Resumen ===");
  for (const i of created) {
    console.log(`  ${i.identifier}  ${i.cycle ? "· cycle " + i.cycle : "· backlog"}  ${i.url}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
