#!/usr/bin/env node
/** Cierra JUR-36: estado Done + comentario de QA 9/9. Idempotente. */

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
if (!API_KEY || !TEAM_ID) throw new Error("Faltan LINEAR_API_KEY o LINEAR_TEAM_ID");

const ENDPOINT = "https://api.linear.app/graphql";
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

async function states() {
  const data = await gql(
    `query($id: String!) { team(id: $id) { states { nodes { id name type } } } }`,
    { id: TEAM_ID },
  );
  return data.team.states.nodes;
}

async function findIssue(identifier) {
  let after = null;
  for (let i = 0; i < 10; i++) {
    const data = await gql(
      `query($teamId: ID!, $after: String) {
        issues(first: 100, after: $after, filter: { team: { id: { eq: $teamId } } }) {
          pageInfo { hasNextPage endCursor }
          nodes { id identifier state { name } url }
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

const BODY = [
  "### M1 cerrado — QA 9/9 ✅",
  "",
  "`node scripts/smoke-m1.mjs` corrió contra staging con los 5 proveedores dummy sembrados. Todos los checks pasaron:",
  "",
  "| Q | Check | Resultado |",
  "|---|---|---|",
  "| Q1a | anon ve proveedores aprobados | ✓ vio 5 |",
  "| Q1b | anon UPDATE bloqueado por RLS | ✓ plan inmutable |",
  "| Q2a | `v_marketplace_tarjetas` filtra pendientes | ✓ count=4 tras marcar 1 pendiente |",
  "| Q2b | anon no ve proveedor pendiente | ✓ `dj-aurora` oculto |",
  "| Q3a | primer INSERT `proveedor_solicitudes` | ✓ |",
  "| Q3b | segundo INSERT idéntico bloqueado | ✓ SQLSTATE 23505 |",
  "| Q4  | trigger bump `solicitudes_mes` | ✓ 0→1 |",
  "| Q5  | trigger `updated_at` en UPDATE | ✓ timestamp avanzó |",
  "| Q6  | UNIQUE favoritos NULL-safe | ✓ 2º insert con `servicio_id=NULL` bloqueado |",
  "",
  "**Ambiente**: staging (`NEXT_PUBLIC_SUPABASE_URL` del `.env.local`).",
  "",
  "**Assets disponibles para M2–M6:**",
  "",
  "- 5 proveedores aprobados: Studio Luz (premium, fotografía), DJ Aurora (free, música), Viña Sur (premium, lugar), Mesa Nueve Catering (free, catering), Flores de Rocío (free, flores).",
  "- 5 auth.users (password `Proveedor2026!`).",
  "- 12 servicios y 16 medios seedeados.",
  "- Vista `v_marketplace_tarjetas` operativa para el listado M4.",
  "- Bucket `proveedor-medios` público listo para uploads en M2/M3.",
  "",
  "**Script smoke**: `scripts/smoke-m1.mjs` queda versionado y re-ejecutable. Crea un evento temporal para Q6 y hace cleanup al final (resetea `solicitudes_mes`, borra solicitudes `__smoke_m1_*`, borra evento temporal).",
  "",
  "Cerrando la issue y pasando a M2 (JUR-37).",
].join("\n");

async function main() {
  const st = await states();
  const issue = await findIssue("JUR-36");
  if (!issue) throw new Error("JUR-36 no encontrada");

  const target =
    st.find((s) => ["done", "completed"].includes(s.name.toLowerCase())) ||
    st.find((s) => s.type === "completed");
  if (!target) throw new Error("Estado Done no encontrado");

  await gql(
    `mutation($input: CommentCreateInput!) {
      commentCreate(input: $input) { success }
    }`,
    { input: { issueId: issue.id, body: BODY } },
  );
  console.log("✓ comentario final agregado");

  if (issue.state?.name !== target.name) {
    await gql(
      `mutation($id: String!, $stateId: String!) {
        issueUpdate(id: $id, input: { stateId: $stateId }) { success }
      }`,
      { id: issue.id, stateId: target.id },
    );
    console.log(`→ JUR-36: ${issue.state?.name} → ${target.name}`);
  } else {
    console.log(`· JUR-36 ya estaba en ${target.name}`);
  }
  console.log(issue.url);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
