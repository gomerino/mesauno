#!/usr/bin/env node
/**
 * Mueve T1/T2 a Done, T3 a In Progress y agrega comentario de avance en T3.
 * Idempotente: busca las issues por identificador JUR-N y actualiza sólo si difiere.
 *
 * Uso:  node scripts/linear-update-status.mjs
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

async function getContext() {
  const data = await gql(
    `
    query($id: String!) {
      team(id: $id) {
        id
        key
        states { nodes { id name type } }
      }
    }
  `,
    { id: TEAM_ID },
  );
  return data.team;
}

async function findIssueByIdentifier(identifier) {
  let after = null;
  for (let i = 0; i < 10; i++) {
    const data = await gql(
      `
      query($teamId: ID!, $after: String) {
        issues(first: 100, after: $after, filter: { team: { id: { eq: $teamId } } }) {
          pageInfo { hasNextPage endCursor }
          nodes { id identifier title state { name } url }
        }
      }
    `,
      { teamId: TEAM_ID, after },
    );
    const hit = data.issues.nodes.find((n) => n.identifier === identifier);
    if (hit) return hit;
    if (!data.issues.pageInfo.hasNextPage) break;
    after = data.issues.pageInfo.endCursor;
  }
  return null;
}

async function updateIssueState(issueId, stateId) {
  await gql(
    `
    mutation($id: String!, $stateId: String!) {
      issueUpdate(id: $id, input: { stateId: $stateId }) { success }
    }
  `,
    { id: issueId, stateId },
  );
}

async function addComment(issueId, body) {
  await gql(
    `
    mutation($input: CommentCreateInput!) {
      commentCreate(input: $input) { success }
    }
  `,
    { input: { issueId, body } },
  );
}

function resolveStateId(states, preferredNames, preferredTypes) {
  for (const name of preferredNames) {
    const hit = states.find((s) => s.name.toLowerCase() === name.toLowerCase());
    if (hit) return hit;
  }
  for (const type of preferredTypes) {
    const hit = states.find((s) => s.type === type);
    if (hit) return hit;
  }
  return null;
}

const PLAN = [
  {
    id: "T6",
    identifier: "JUR-14",
    targetNames: ["Done", "Completed"],
    targetTypes: ["completed"],
    comment: [
      "### Cierre T6 ✅",
      "",
      "- Nuevo modal `BulkImportInvitados` con textarea y preview en tiempo real.",
      "- Helper puro `src/lib/invitados-bulk.ts`: parseo, validación y detección de duplicados (contra lista existente y dentro del batch).",
      "- Badges por estado: Nuevo · Se omite · Inválido. Contadores totales y por categoría.",
      "- Insert en batch vía `insert_invitado_panel` con manejo de errores parciales.",
      "- Analytics: `bulk_import_opened`, `bulk_import_submitted` con `count_total`, `count_new`, `count_dup`, `count_invalid`, `count_ok`, `count_fail`.",
      "- Modal sigue la guideline de `.cursor/rules/mobile-form-footer.mdc`.",
      "- Typecheck + ESLint OK. QA validado por founder.",
    ].join("\n"),
  },
];

async function main() {
  const team = await getContext();
  const states = team.states.nodes;

  for (const item of PLAN) {
    const issue = await findIssueByIdentifier(item.identifier);
    if (!issue) {
      console.log(`· ${item.identifier} no encontrada, salteando`);
      continue;
    }
    const target = resolveStateId(states, item.targetNames, item.targetTypes);
    if (!target) {
      console.log(`· ${item.identifier}: no se pudo resolver estado destino`);
      continue;
    }
    const needStateChange = issue.state?.name !== target.name;
    if (needStateChange) {
      await updateIssueState(issue.id, target.id);
      console.log(`→ ${item.identifier}: ${issue.state?.name || "?"} → ${target.name}`);
    } else {
      console.log(`· ${item.identifier}: ya estaba en ${target.name}`);
    }
    await addComment(issue.id, item.comment);
    console.log(`  comentario agregado`);
  }

  console.log("\nListo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
