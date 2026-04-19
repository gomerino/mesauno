#!/usr/bin/env node
/**
 * Mueve JUR-36 (M1 — providers schema) a "In Progress" y agrega comentario
 * con el snapshot de avance. Idempotente.
 *
 * Uso:  node scripts/linear-jur36-in-progress.mjs
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

async function getStates() {
  const data = await gql(
    `query($id: String!) {
      team(id: $id) { states { nodes { id name type } } }
    }`,
    { id: TEAM_ID },
  );
  return data.team.states.nodes;
}

async function findIssueByIdentifier(identifier) {
  let after = null;
  for (let i = 0; i < 10; i++) {
    const data = await gql(
      `query($teamId: ID!, $after: String) {
        issues(first: 100, after: $after, filter: { team: { id: { eq: $teamId } } }) {
          pageInfo { hasNextPage endCursor }
          nodes { id identifier title state { name } url }
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

async function updateIssueState(issueId, stateId) {
  await gql(
    `mutation($id: String!, $stateId: String!) {
      issueUpdate(id: $id, input: { stateId: $stateId }) { success }
    }`,
    { id: issueId, stateId },
  );
}

async function addComment(issueId, body) {
  await gql(
    `mutation($input: CommentCreateInput!) {
      commentCreate(input: $input) { success }
    }`,
    { input: { issueId, body } },
  );
}

function resolveStateByNames(states, names, types) {
  for (const n of names) {
    const h = states.find((s) => s.name.toLowerCase() === n.toLowerCase());
    if (h) return h;
  }
  for (const t of types) {
    const h = states.find((s) => s.type === t);
    if (h) return h;
  }
  return null;
}

const COMMENT = [
  "### Avance M1 — providers schema 🚧",
  "",
  "**En esta tanda (rama local, pendiente de aplicar en Supabase):**",
  "",
  "- `supabase/migration_marketplace_providers.sql` — 5 tablas + RLS + bucket `provider-media` + vista `v_marketplace_cards` + triggers (`updated_at`, bump `leads_this_month`).",
  "- `src/types/database.ts` — tipos `Provider`, `ProviderService`, `ProviderMedia`, `ProviderLead`, `ProviderWishlistItem`, `MarketplaceCard`.",
  "- `src/lib/providers/` — módulos `constants`, `slug`, `queries`, `leads`, `wishlist` + `index` barrel.",
  "- `scripts/seed-providers-dummy.mjs` — 5 proveedores dummy approved para staging (idempotente, usa service role).",
  "- Typecheck (`tsc --noEmit`) limpio. Sin lints nuevos.",
  "",
  "**Pendiente para cerrar M1:**",
  "",
  "1. Correr la migración en Supabase staging.",
  "2. `node scripts/seed-providers-dummy.mjs` → verificar que aparezcan 5 providers.",
  "3. Validar las Q1–Q14 del workflow `workflows/M01-providers-schema/qa.md`.",
  "4. Smoke: insertar un lead como dummy user y confirmar bump `leads_this_month`.",
  "5. Code review + merge.",
  "",
  "**Decisiones tomadas (detalle en workflow):**",
  "",
  "- `slug` inmutable post-creación (no soportamos rename con redirect en MVP).",
  "- Storage: `provider-media` bucket público; INSERT permitido a authenticated (validación por user/provider en capa API).",
  "- Lógica de rate limit + `plan_capped` vive en `src/lib/providers/leads.ts` (capa app), defensa en DB vía UNIQUE(provider, sender, channel, day).",
  "- Tabla `marketplace_servicios` queda marcada DEPRECATED (comment); borrado en ticket aparte tras 30 días.",
].join("\n");

async function main() {
  const states = await getStates();
  const issue = await findIssueByIdentifier("JUR-36");
  if (!issue) {
    console.error("JUR-36 no encontrada.");
    process.exit(1);
  }

  const target = resolveStateByNames(
    states,
    ["In Progress", "In progress", "Doing"],
    ["started"],
  );
  if (!target) {
    console.error("No se pudo resolver el estado In Progress.");
    process.exit(1);
  }

  if (issue.state?.name !== target.name) {
    await updateIssueState(issue.id, target.id);
    console.log(`→ JUR-36: ${issue.state?.name || "?"} → ${target.name}`);
  } else {
    console.log(`· JUR-36: ya estaba en ${target.name}`);
  }

  await addComment(issue.id, COMMENT);
  console.log("  comentario agregado");
  console.log("\n" + issue.url);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
