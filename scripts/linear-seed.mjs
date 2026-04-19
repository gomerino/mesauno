#!/usr/bin/env node
/**
 * Linear seed script — Jurnex backlog.
 *
 * Crea labels, issues NOW/NEXT/LATER y un Cycle "Semana 1" en el team JUR.
 * Idempotente: si una label/cycle/issue con mismo título ya existe, lo reutiliza y no duplica.
 *
 * Uso:
 *   node scripts/linear-seed.mjs
 *
 * Variables esperadas en .env.local:
 *   LINEAR_API_KEY=lin_api_...
 *   LINEAR_TEAM_ID=fca62a1d-...   (o LINEAR_TEAM_KEY si no se conoce el id)
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
    headers: {
      "Content-Type": "application/json",
      Authorization: API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error("Linear error: " + JSON.stringify(json.errors));
  }
  return json.data;
}

async function getTeamContext() {
  const data = await gql(`
    query($id: String!) {
      team(id: $id) {
        id
        key
        name
        states { nodes { id name type } }
        labels { nodes { id name } }
        cycles { nodes { id name startsAt endsAt } }
      }
    }
  `, { id: TEAM_ID });
  return data.team;
}

async function ensureLabel(existing, name, color) {
  const hit = existing.find((l) => l.name.toLowerCase() === name.toLowerCase());
  if (hit) return hit.id;
  const data = await gql(`
    mutation($name: String!, $color: String!, $teamId: String!) {
      issueLabelCreate(input: { name: $name, color: $color, teamId: $teamId }) {
        success
        issueLabel { id name }
      }
    }
  `, { name, color, teamId: TEAM_ID });
  return data.issueLabelCreate.issueLabel.id;
}

async function listAllIssueTitles() {
  const titles = new Map();
  let after = null;
  for (let i = 0; i < 10; i++) {
    const data = await gql(`
      query($teamId: ID!, $after: String) {
        issues(first: 100, after: $after, filter: { team: { id: { eq: $teamId } } }) {
          pageInfo { hasNextPage endCursor }
          nodes { id identifier title url }
        }
      }
    `, { teamId: TEAM_ID, after });
    for (const n of data.issues.nodes) titles.set(n.title, n);
    if (!data.issues.pageInfo.hasNextPage) break;
    after = data.issues.pageInfo.endCursor;
  }
  return titles;
}

async function createIssueIfMissing(existing, payload) {
  const hit = existing.get(payload.title);
  if (hit) return { ...hit, reused: true };
  const data = await gql(`
    mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier title url }
      }
    }
  `, { input: payload });
  const issue = data.issueCreate.issue;
  existing.set(issue.title, issue);
  return { ...issue, reused: false };
}

async function ensureCycle(existingCycles, name) {
  const hit = existingCycles.find((c) => c.name === name);
  if (hit) return hit;
  const now = new Date();
  const day = now.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday));
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  const data = await gql(`
    mutation($input: CycleCreateInput!) {
      cycleCreate(input: $input) {
        success
        cycle { id name startsAt endsAt }
      }
    }
  `, {
    input: {
      teamId: TEAM_ID,
      name,
      startsAt: monday.toISOString(),
      endsAt: sunday.toISOString(),
    },
  });
  return data.cycleCreate.cycle;
}

async function assignIssueToCycle(issueId, cycleId) {
  await gql(`
    mutation($id: String!, $cycleId: String!) {
      issueUpdate(id: $id, input: { cycleId: $cycleId }) {
        success
      }
    }
  `, { id: issueId, cycleId });
}

function desc(parts) {
  return parts.join("\n");
}

const LABEL_SPEC = [
  ["panel", "#5E6AD2"],
  ["invitados", "#0EA5E9"],
  ["evento", "#F59E0B"],
  ["ux", "#EC4899"],
  ["analytics", "#10B981"],
  ["tech", "#6366F1"],
  ["qa", "#14B8A6"],
  ["mobile", "#A855F7"],
  ["p0", "#EF4444"],
  ["p1", "#F97316"],
  ["later", "#64748B"],
];

const ISSUES = [
  {
    title: "T1 — Integración /panel → /panel/invitados (flujo misión)",
    priority: 1,
    state: "Todo",
    labels: ["panel", "invitados", "ux", "p0"],
    cycle: "now",
    description: desc([
      "## Objetivo",
      "Guiar al organizador desde el dashboard misión hasta gestionar invitados y volver con estado actualizado.",
      "",
      "## Alcance",
      "- Card Pasajeros en /panel con estado dinámico (empty/in_progress/completed)",
      "- CTA contextual por estado",
      "- Navegación a /panel/invitados?from=mission",
      "- En /panel/invitados: banner contextual + botón \"Volver al panel\"",
      "- Revalidar estado al regresar",
      "",
      "## DoD",
      "- CTA cambia según estado real",
      "- Ir y volver sin refresh manual",
      "- Mobile y desktop sin regresiones",
      "",
      "## Métrica",
      "- % panel→invitados",
      "- % vuelve al panel con progreso",
      "",
      "## No incluye",
      "- Rediseño completo del dashboard",
    ]),
  },
  {
    title: "T2 — Contrato único de estado Invitados",
    priority: 1,
    state: "Todo",
    labels: ["panel", "invitados", "tech", "p0"],
    cycle: "now",
    description: desc([
      "## Objetivo",
      "Una sola fuente de verdad para el estado de misión invitados.",
      "",
      "## Alcance",
      "- Helper único: guestMissionStatus(evento, invitados) -> empty | in_progress | completed",
      "- Usado en /panel y /panel/invitados",
      "- Eliminar lógica duplicada",
      "",
      "## DoD",
      "- No hay más de una función decidiendo el estado",
      "- Todos los consumidores importan el helper",
      "",
      "## Métrica",
      "- Reducción de bugs de estado inconsistente",
      "",
      "## No incluye",
      "- Refactor global de progreso",
    ]),
  },
  {
    title: "T3 — Analytics + QA del flujo panel↔invitados",
    priority: 1,
    state: "Todo",
    labels: ["analytics", "qa", "p0"],
    cycle: "now",
    description: desc([
      "## Objetivo",
      "Flujo medible y estable en mobile/desktop.",
      "",
      "## Alcance",
      "- Eventos: panel_viewed, panel_mission_cta_clicked, guests_page_viewed, guest_created, guests_back_to_panel, mission_card_completed",
      "- QA checklist: navegación, estados, errores, validaciones",
      "",
      "## DoD",
      "- Eventos emitidos en todos los caminos principales",
      "- Checklist QA pasado mobile y desktop",
      "",
      "## Métrica",
      "- time_panel_to_first_guest",
      "- panel_to_invitados_rate",
      "",
      "## No incluye",
      "- Dashboard analytics avanzado",
    ]),
  },
  {
    title: "T4 — Dashboard misión con orden dinámico",
    priority: 2,
    state: "Backlog",
    labels: ["panel", "ux", "p1"],
    description: "Prioriza cards por next-step real del usuario. Card Evento/Pasajeros/Programa/Experiencia se reordenan según progreso y fase del journey.",
  },
  {
    title: "T5 — Evento: resumen editable 100%",
    priority: 2,
    state: "Backlog",
    labels: ["evento", "ux", "p1"],
    description: "Menos formulario largo, edición por bloques. Ubicación con nombre del lugar. Sin duplicidad de fecha.",
  },
  {
    title: "T6 — Invitados básico mejorado",
    priority: 2,
    state: "Backlog",
    labels: ["invitados", "ux", "p1"],
    description: "Bulk import simple, validación inline de duplicados, feedback de errores claro.",
  },
  {
    title: "T7 — Consistencia visual mobile/desktop",
    priority: 2,
    state: "Backlog",
    labels: ["ux", "p1"],
    description: "Spacing, grid y jerarquía homogéneos entre breakpoints.",
  },
  {
    title: "T8 — Bottom sheet mobile robusto",
    priority: 2,
    state: "Backlog",
    labels: ["mobile", "ux", "p1"],
    description: "Scroll interno, sticky footer, cierre con swipe, z-index y animaciones correctas.",
  },
  {
    title: "Programa visual completo",
    priority: 3,
    state: "Backlog",
    labels: ["later"],
    description: "Timeline visual, bloques editables, vista invitado vs organizador. Integración con etapa Despegue.",
  },
  {
    title: "Experiencia en vivo (En vuelo)",
    priority: 3,
    state: "Backlog",
    labels: ["later"],
    description: "Feed en tiempo real, fotos compartidas, interacción invitados, mensajes push.",
  },
  {
    title: "Marketplace proveedores",
    priority: 3,
    state: "Backlog",
    labels: ["later"],
    description: "Centros de eventos, fotografía, música, catering. Agenda integrada.",
  },
  {
    title: "IA sugerencias",
    priority: 3,
    state: "Backlog",
    labels: ["later"],
    description: "Sugerencias de programa, mensajes automáticos, recomendación de proveedores.",
  },
  {
    title: "Monetización pro avanzada",
    priority: 3,
    state: "Backlog",
    labels: ["later"],
    description: "Planes Free vs Pro. Features premium: personalización, IA, analytics.",
  },
  {
    title: "Viral loops",
    priority: 3,
    state: "Backlog",
    labels: ["later"],
    description: "Invitaciones compartibles, links públicos, experiencia invitado sin login.",
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

  console.log("→ Asegurando cycle 'Semana 1'…");
  const cycle = await ensureCycle(team.cycles.nodes, "Semana 1");

  console.log("→ Leyendo issues existentes…");
  const existing = await listAllIssueTitles();

  const createdNow = [];
  const createdNext = [];
  const createdLater = [];

  for (const spec of ISSUES) {
    const stateId = stateByName.get(spec.state);
    const labelIds = spec.labels.map((n) => labelIdByName.get(n)).filter(Boolean);
    const payload = {
      teamId: TEAM_ID,
      title: spec.title,
      description: spec.description,
      priority: spec.priority,
      stateId,
      labelIds,
    };
    const issue = await createIssueIfMissing(existing, payload);
    if (spec.cycle === "now") {
      await assignIssueToCycle(issue.id, cycle.id);
      createdNow.push(issue);
    } else if (spec.state === "Backlog" && spec.labels.includes("later")) {
      createdLater.push(issue);
    } else {
      createdNext.push(issue);
    }
    const tag = issue.reused ? "(reusado)" : "(nuevo)";
    console.log(`  ${issue.identifier}  ${tag}  ${issue.title}`);
  }

  console.log("\n=== Resumen ===");
  console.log(`Cycle: ${cycle.name} (${cycle.id})`);
  console.log(`\nNOW (asignados al cycle):`);
  for (const i of createdNow) console.log(`  ${i.identifier}  ${i.url}`);
  console.log(`\nNEXT:`);
  for (const i of createdNext) console.log(`  ${i.identifier}  ${i.url}`);
  console.log(`\nLATER:`);
  for (const i of createdLater) console.log(`  ${i.identifier}  ${i.url}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
