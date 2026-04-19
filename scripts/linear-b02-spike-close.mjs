#!/usr/bin/env node
/**
 * Cierra en Linear los spikes B02-S1, S2, S3: comentario de cierre + estado Done.
 * Idempotente en estado: si ya está en Done, no vuelve a comentar si el último comentario
 * contiene el marcador `<!-- b02-spike-closed -->`.
 *
 * Uso: node scripts/linear-b02-spike-close.mjs
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
if (!API_KEY) throw new Error("Falta LINEAR_API_KEY");
if (!TEAM_ID) throw new Error("Falta LINEAR_TEAM_ID");

const ENDPOINT = "https://api.linear.app/graphql";
const MARKER = "<!-- b02-spike-closed -->";

async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: API_KEY },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function teamStates() {
  const data = await gql(
    `query($id: String!) {
      team(id: $id) {
        states { nodes { id name type } }
      }
    }`,
    { id: TEAM_ID },
  );
  return data.team.states.nodes;
}

function resolveDoneState(states) {
  const byName = states.find((s) => s.name.toLowerCase() === "done");
  if (byName) return byName;
  return states.find((s) => s.type === "completed");
}

async function findIssueByTitleContains(term) {
  const data = await gql(
    `query($teamId: ID!, $term: String!) {
      issues(first: 15, filter: { team: { id: { eq: $teamId } }, title: { containsIgnoreCase: $term } }) {
        nodes { id identifier title state { id name type } url }
      }
    }`,
    { teamId: TEAM_ID, term },
  );
  const nodes = data.issues.nodes;
  return nodes.find((n) => n.title.includes(term)) ?? nodes[0] ?? null;
}

async function lastCommentsBodies(issueId) {
  const data = await gql(
    `query($issueId: String!) {
      issue(id: $issueId) {
        comments(first: 8) {
          nodes { body }
        }
      }
    }`,
    { issueId },
  );
  return (data.issue?.comments?.nodes ?? []).map((c) => c.body);
}

async function addComment(issueId, body) {
  await gql(
    `mutation($input: CommentCreateInput!) {
      commentCreate(input: $input) { success }
    }`,
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

const DOC = "`workflows/B02-viaje-modulos-por-fase/spike-resultados.md`";

const SPIKES = [
  {
    search: "SPIKE B02-S1",
    comment: [
      MARKER,
      "### Cierre spike B02-S1 — Spotify (Done)",
      "",
      `Entregable actualizado: ${DOC} (sección S1).`,
      "",
      "**Hecho en repo:** OAuth + `evento_spotify`; búsqueda Client Credentials; música colaborativa en invitación (aportes `playlist_aportes`, apoyos `playlist_apoyos`, ranking); `SpotifyPlaylistConnect` en `/panel/evento#musica-spotify` y enlace desde Experiencia.",
      "",
      "**Riesgo operativo (no bloquea spike):** app Spotify en modo Development / 403 al escribir en playlist si falta Users and access — seguimiento en producto B02-04.",
      "",
      "**B02-04 siguiente:** UX de errores, métricas, opcional últimos aportes en panel.",
    ].join("\n"),
  },
  {
    search: "SPIKE B02-S2",
    comment: [
      MARKER,
      "### Cierre spike B02-S2 — Fotos ↔ programa (Done)",
      "",
      `Entregable: ${DOC} (sección S2).`,
      "",
      "**v0 implementado:** RPC `programa_con_fotos_ventanas_publica` en `supabase/migration_programa_con_fotos_publica.sql` — hitos + fotos por ventana de tiempo (`created_at`, TZ `America/Santiago`).",
      "",
      "**Extensiones posteriores:** EXIF (`capturada_at`), TZ por evento, asignación manual a hito.",
    ].join("\n"),
  },
  {
    search: "SPIKE B02-S3",
    comment: [
      MARKER,
      "### Cierre spike B02-S3 — WhatsApp (Done)",
      "",
      `Entregable: ${DOC} (sección S3).`,
      "",
      "**Decisión:** hoy solo deep link 1:1 (`wa.me`); no masivo por API hasta WABA/BSP y compliance.",
      "",
      "**B02-03:** copy y superficie “cómo funciona WhatsApp” sin prometer masivo.",
    ].join("\n"),
  },
];

async function main() {
  const states = await teamStates();
  const done = resolveDoneState(states);
  if (!done) throw new Error("No se encontró estado Done/completed en el equipo Linear");

  for (const spike of SPIKES) {
    const issue = await findIssueByTitleContains(spike.search);
    if (!issue) {
      console.warn("No encontré issue:", spike.search);
      continue;
    }
    const bodies = await lastCommentsBodies(issue.id);
    const alreadyClosed = bodies.some((b) => b.includes(MARKER));
    if (!alreadyClosed) {
      await addComment(issue.id, spike.comment);
      console.log("Comentario →", issue.identifier, issue.title.slice(0, 55));
    } else {
      console.log("Ya cerrado (marcador) →", issue.identifier);
    }

    if (issue.state?.id !== done.id) {
      await updateIssueState(issue.id, done.id);
      console.log("  estado →", done.name);
    } else {
      console.log("  ya en", done.name);
    }
  }
  console.log("\nListo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
