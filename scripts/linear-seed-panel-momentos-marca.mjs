#!/usr/bin/env node
/**
 * Crea issues B01 (panel por momentos + marca Jurnex) en Linear.
 * Idempotente: no duplica por título exacto.
 *
 * Uso: node scripts/linear-seed-panel-momentos-marca.mjs
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

const ISSUES = [
  {
    title: "B01-01 — Panel: orden de tarjetas alineado a los 3 tiempos",
    priority: 2,
    state: "Backlog",
    labels: ["panel", "ux", "p1"],
    description: desc([
      "## Épica",
      "B01 — Panel por momentos + marca Jurnex (`workflows/B01-panel-momentos-marca/hu.md`).",
      "",
      "## Objetivo",
      "Fijar y aplicar el orden de las 4 cards (Evento, Pasajeros, Programa, Experiencia) para cada fase: check-in, despegue, en-vuelo.",
      "",
      "## Alcance",
      "- Tabla de verdad única (documento + código).",
      "- Alinear `phaseBase` en `JourneyViajeClient` si hace falta.",
      "- Mobile: primera tarjeta = la más accionable del momento.",
      "",
      "## DoD",
      "- Sin regresión en `mission_card_completed` / analytics.",
      "- Revisión PM+UX con checklist en `hu.md`.",
      "",
      "## Referencia",
      "`workflows/B01-panel-momentos-marca/hu.md` (HU-B01-01).",
    ]),
  },
  {
    title: "B01-02 — Panel: homologación dorado premium (tokens + auditoría)",
    priority: 2,
    state: "Backlog",
    labels: ["panel", "ux", "p1"],
    description: desc([
      "## Épica",
      "B01 — Panel por momentos + marca Jurnex.",
      "",
      "## Objetivo",
      "Unificar acentos dorados y superficies premium en `/panel/*` (sin tocar `/invitacion/*`).",
      "",
      "## Alcance",
      "- Auditoría: lista de pantallas con desviaciones.",
      "- Tokens (oro primario/claro/sombras) documentados en `branding.md` o `panel-themes`.",
      "- Corrección por lotes: shell, CTAs, cards journey.",
      "",
      "## DoD",
      "- Contraste accesible en texto sobre fondo oscuro.",
      "- `tsc` + eslint limpios.",
      "",
      "## Referencia",
      "`workflows/B01-panel-momentos-marca/branding.md` + HU-B01-02.",
    ]),
  },
  {
    title: "B01-03 — Panel: navegación primaria por momentos (v1)",
    priority: 2,
    state: "Backlog",
    labels: ["panel", "ux", "p1", "analytics"],
    description: desc([
      "## Épica",
      "B01 — Panel por momentos + marca Jurnex.",
      "",
      "## Objetivo",
      "Orientación explícita por Preparativos / Tu gran día / Experiencia (enlaces a rutas actuales).",
      "",
      "## Alcance",
      "- Patrón visible: tabs, rail o similar (mobile-first).",
      "- `trackEvent('moment_nav_clicked', { moment })` sin PII.",
      "",
      "## DoD",
      "- No duplicar h1; una jerarquía clara con `JourneyPhasesBar` (convivencia o recorte en B01-04).",
      "",
      "## Referencia",
      "`workflows/B01-panel-momentos-marca/ux.md` + HU-B01-03.",
    ]),
  },
  {
    title: "B01-04 — Panel: decisión botonera (JourneyPhasesBar) vs navegación por momentos",
    priority: 3,
    state: "Backlog",
    labels: ["panel", "ux", "p2"],
    description: desc([
      "## Objetivo",
      "Documentar decisión: mantener, fusionar o simplificar el stepper de 3 fases frente a la nav por momentos.",
      "",
      "## Entregables",
      "- Doc 1 página: opciones A/B/C (`ux.md`).",
      "- Ticket hijo si hace falta implementación (deprecar duplicidad).",
      "",
      "## Criterio",
      "Una sola fuente de verdad para \"en qué tiempo estoy\".",
      "",
      "## Referencia",
      "`workflows/B01-panel-momentos-marca/ux.md` (HU-B01-04).",
    ]),
  },
  {
    title: "B01-05 — Marca Jurnex: kit mínimo + aplicación shell y marketing",
    priority: 3,
    state: "Backlog",
    labels: ["ux", "growth", "p2"],
    description: desc([
      "## Objetivo",
      "Logo (SVG), paleta, tipografía, voz; checklist de aplicación en header marketing y metadatos.",
      "",
      "## Alcance",
      "- Wordmark temporal si no hay logo final.",
      "- `metadata` / OG / favicon cuando existan assets.",
      "- Alineación con `branding.md`.",
      "",
      "## No incluye",
      "- Manual de marca extendido.",
      "",
      "## Referencia",
      "`workflows/B01-panel-momentos-marca/branding.md` (HU-B01-05).",
    ]),
  },
  {
    title: "B01-06 — Panel: motion premium coherente (reduced-motion safe)",
    priority: 4,
    state: "Backlog",
    labels: ["panel", "ux", "p2"],
    description: desc([
      "## Objetivo",
      "Micro-interacciones alineadas al kit dorado; respetar `prefers-reduced-motion`.",
      "",
      "## Dependencias",
      "Recomendable tras B01-02.",
      "",
      "## Referencia",
      "`workflows/B01-panel-momentos-marca/hu.md` (HU-B01-06).",
    ]),
  },
  {
    title: "B01-07 — Marketing: landings bajo marca Jurnex (SEO + OG)",
    priority: 4,
    state: "Backlog",
    labels: ["growth", "p2"],
    description: desc([
      "## Objetivo",
      "Alinear `/`, `/para-proveedores`, `/pricing` con kit B01-05.",
      "",
      "## Referencia",
      "`workflows/B01-panel-momentos-marca/hu.md` (HU-B01-07).",
    ]),
  },
];

async function main() {
  console.log("→ Linear: B01 panel momentos + marca Jurnex…");
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
