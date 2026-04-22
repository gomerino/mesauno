#!/usr/bin/env node
/**
 * Cierra en Linear issues B01 ya entregados en el panel (rama feat/m02-onboarding-proveedores,
 * commit de referencia en comentario). Idempotente: marcador `<!-- b01-shipped -->` en el último cierre.
 *
 * Uso: node scripts/linear-close-b01-shipped.mjs
 *
 * Issues cerrados: JUR-51, JUR-52, JUR-53, JUR-55 (B01-01, 02, 03, 05).
 * No cierra: JUR-54 (decisión botonera / doc), JUR-56 (motion), JUR-57 (marketing/SEO — seguimiento).
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
const MARKER = "<!-- b01-shipped -->";
const REF = "Rama `feat/m02-onboarding-proveedores` — panel unificado (viaje/pasajeros), misiones evento+invitados, marca Jurnex y migraciones asociadas.";

async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: API_KEY },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error("Linear: " + JSON.stringify(json.errors));
  return json.data;
}

async function teamStates() {
  const data = await gql(
    `query($id: String!) { team(id: $id) { states { nodes { id name type } } } }`,
    { id: TEAM_ID },
  );
  return data.team.states.nodes;
}

function resolveDoneState(states) {
  const byName = states.find((s) => s.name.toLowerCase() === "done");
  if (byName) return byName;
  return states.find((s) => s.type === "completed");
}

async function findIssueByIdentifier(identifier) {
  let after = null;
  for (let i = 0; i < 15; i++) {
    const data = await gql(
      `query($teamId: ID!, $after: String) {
        issues(first: 100, after: $after, filter: { team: { id: { eq: $teamId } } }) {
          pageInfo { hasNextPage endCursor }
          nodes { id identifier title state { id name } url }
        }
      }`,
      { teamId: TEAM_ID, after },
    );
    const hit = data.issues.nodes.find((n) => n.identifier === identifier);
    if (hit) return hit;
    if (!data.issues.pageInfo.hasNextPage) break;
    after = data.issues.pageInfo.endCursor;
  }
  return null;
}

async function lastCommentsBodies(issueId) {
  const data = await gql(
    `query($issueId: String!) {
      issue(id: $issueId) {
        comments(first: 12) { nodes { body } }
      }
    }`,
    { issueId },
  );
  return (data.issue?.comments?.nodes ?? []).map((c) => c.body);
}

async function addComment(issueId, body) {
  await gql(
    `mutation($input: CommentCreateInput!) { commentCreate(input: $input) { success } }`,
    { input: { issueId, body } },
  );
}

async function updateIssueState(issueId, stateId) {
  await gql(
    `mutation($id: String!, $stateId: String!) {
      issueUpdate(id: $id, input: { stateId: $stateId }) { success }
    }`,
    { id: issueId, stateId },
  );
}

const ISSUES = [
  {
    identifier: "JUR-51",
    titleHint: "B01-01",
    comment: [
      MARKER,
      "### B01-01 — Orden de tarjetas × 3 tiempos (Done)",
      "",
      REF,
      "",
      "**Entregado:** `getPhaseBaseOrder` en `src/lib/journey-card-order.ts` + consumo en `JourneyViajeClient`; primera tarjeta priorizada en mobile según fase.",
      "",
      "**Doc:** `workflows/B01-panel-momentos-marca/hu.md` (HU-B01-01).",
    ].join("\n"),
  },
  {
    identifier: "JUR-52",
    titleHint: "B01-02",
    comment: [
      MARKER,
      "### B01-02 — Homologación dorado / superficies premium (Done)",
      "",
      REF,
      "",
      "**Entregado:** DS panel (`src/components/panel/ds/`), tokens en `src/theme/panel-themes.ts` / `styles/tokens.ts`, cards journey con acentos coherentes (oro + teal). Auditoría exhaustiva por pantalla puede seguir como mejora continua.",
      "",
      "**Doc:** `workflows/B01-panel-momentos-marca/hu.md` (HU-B01-02).",
    ].join("\n"),
  },
  {
    identifier: "JUR-53",
    titleHint: "B01-03",
    comment: [
      MARKER,
      "### B01-03 — Navegación primaria alineada al viaje (v1) (Done)",
      "",
      REF,
      "",
      "**Entregado:** Rutas `/panel/viaje`, `/panel/pasajeros`, `/panel/recuerdos`, `/panel/ajustes`; `panel-nav-config.ts` + chrome móvil. Convive con el stepper de fases.",
      "",
      "**Seguimiento opcional:** evento `moment_nav_clicked` en analytics (DoD original) — ticket hijo si hace falta.",
      "",
      "**Doc:** `workflows/B01-panel-momentos-marca/hu.md` (HU-B01-03).",
    ].join("\n"),
  },
  {
    identifier: "JUR-55",
    titleHint: "B01-05",
    comment: [
      MARKER,
      "### B01-05 — Kit marca Jurnex mínimo (Done)",
      "",
      REF,
      "",
      "**Entregado:** assets en `public/brand/jurnex/`, componentes `src/components/brand/`, integración en header/shell donde aplica; tokens de color referenciados.",
      "",
      "**Doc:** `workflows/B01-panel-momentos-marca/hu.md` (HU-B01-05).",
    ].join("\n"),
  },
];

async function main() {
  const states = await teamStates();
  const done = resolveDoneState(states);
  if (!done) throw new Error("No hay estado Done en el equipo Linear");

  for (const spec of ISSUES) {
    const issue = await findIssueByIdentifier(spec.identifier);
    if (!issue) {
      console.warn("⚠ No encontrada:", spec.identifier, `(${spec.titleHint})`);
      continue;
    }
    if (!issue.title.includes("B01-") && !issue.title.toLowerCase().includes("panel")) {
      console.warn("⚠", spec.identifier, "título inesperado:", issue.title.slice(0, 80));
    }

    const bodies = await lastCommentsBodies(issue.id);
    const already = bodies.some((b) => b.includes(MARKER));
    if (!already) {
      await addComment(issue.id, spec.comment);
      console.log("Comentario →", issue.identifier, issue.title.slice(0, 60));
    } else {
      console.log("Ya marcada →", issue.identifier);
    }

    if (issue.state?.id !== done.id) {
      await updateIssueState(issue.id, done.id);
      console.log("  estado →", done.name, issue.url);
    } else {
      console.log("  ya en", done.name, issue.url);
    }
  }

  console.log("\nListo. Pendientes de cierre manual si aplica: JUR-54 (decisión botonera), JUR-56 (motion), JUR-57 (marketing/SEO).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
