#!/usr/bin/env node
/**
 * Añade un comentario de cierre en issues SPIKE B02-S1, S2, S3 con resumen + ruta al doc.
 * Idempotente por contenido: si el último comentario ya contiene "spike-resultados.md", no duplica.
 *
 * Uso: node scripts/linear-b02-spike-comments.mjs
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

const DOC = "workflows/B02-viaje-modulos-por-fase/spike-resultados.md";

const COMMENTS = [
  {
    titlePrefix: "SPIKE B02-S1 —",
    body: [
      "**Spike cerrado (repo)**",
      "",
      "Resumen y decisiones recomendadas para B02-04: ver `" + DOC + "`.",
      "",
      "**Hallazgo crítico:** `SpotifyPlaylistConnect` existe pero **no está importado en ninguna página** del panel; el callback OAuth sigue redirigiendo a `/panel/evento?spotify=connected`. Integrar UI + leer estado en Experiencia/ Evento es el siguiente paso de implementación.",
    ].join("\n"),
  },
  {
    titlePrefix: "SPIKE B02-S2 —",
    body: [
      "**Spike cerrado (repo)**",
      "",
      "Modelo actual (`evento_fotos` sin EXIF; hitos con `hora` tipo `time`): ver `" + DOC + "` sección S2.",
      "",
      "**Recomendación v0:** asociar fotos a hitos por ventanas de tiempo usando `created_at` + TZ del evento; EXIF y asignación manual como extensiones.",
    ].join("\n"),
  },
  {
    titlePrefix: "SPIKE B02-S3 —",
    body: [
      "**Spike cerrado (repo)**",
      "",
      "Qué hay hoy (wa.me 1:1) vs qué no hay (Cloud API / masivo): ver `" + DOC + "` sección S3.",
      "",
      "**Copy UI:** no prometer envío masivo automático por WhatsApp hasta integración WABA/BSP y compliance.",
    ].join("\n"),
  },
];

async function findIssueIdByTitlePrefix(prefix) {
  const data = await gql(
    `query($teamId: ID!, $term: String!) {
      issues(first: 20, filter: { team: { id: { eq: $teamId } }, title: { containsIgnoreCase: $term } }) {
        nodes { id identifier title }
      }
    }`,
    { teamId: TEAM_ID, term: prefix.replace(/—.*$/, "").trim() },
  );
  const nodes = data.issues.nodes;
  const hit = nodes.find((n) => n.title.startsWith(prefix.trim()));
  return hit ?? nodes[0] ?? null;
}

async function lastCommentBody(issueId) {
  const data = await gql(
    `query($issueId: String!) {
      issue(id: $issueId) {
        comments(first: 5) {
          nodes { body }
        }
      }
    }`,
    { issueId },
  );
  const nodes = data.issue?.comments?.nodes ?? [];
  return nodes.map((c) => c.body).join("\n");
}

async function addComment(issueId, body) {
  await gql(
    `mutation($input: CommentCreateInput!) {
      commentCreate(input: $input) {
        success
        comment { id url }
      }
    }`,
    { input: { issueId, body } },
  );
}

async function main() {
  for (const { titlePrefix, body } of COMMENTS) {
    const issue = await findIssueIdByTitlePrefix(titlePrefix);
    if (!issue) {
      console.warn("No encontré issue con prefijo:", titlePrefix);
      continue;
    }
    const prev = await lastCommentBody(issue.id);
    if (prev.includes("spike-resultados.md")) {
      console.log(issue.identifier, "— ya tenía comentario con doc, omito");
      continue;
    }
    await addComment(issue.id, body);
    console.log("Comentario en", issue.identifier, issue.title.slice(0, 50) + "…");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
