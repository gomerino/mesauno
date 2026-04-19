#!/usr/bin/env node
/**
 * Mueve JUR-37 (M02 — provider onboarding self-serve) a "In Review" (o Done
 * según política: pasamos a In Review porque el PR queda abierto esperando
 * validación manual) y agrega comentario con el snapshot de avance.
 *
 * Uso:  node scripts/linear-jur37-done.mjs
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
    const nodes = data.issues.nodes;
    const found = nodes.find((n) => n.identifier === identifier);
    if (found) return found;
    if (!data.issues.pageInfo.hasNextPage) return null;
    after = data.issues.pageInfo.endCursor;
  }
  return null;
}

async function updateIssueState(issueId, stateId) {
  await gql(
    `mutation($id: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $id, input: $input) { success issue { identifier state { name } } }
    }`,
    { id: issueId, input: { stateId } },
  );
}

async function addComment(issueId, body) {
  await gql(
    `mutation($input: CommentCreateInput!) {
      commentCreate(input: $input) { success comment { id } }
    }`,
    { input: { issueId, body } },
  );
}

const COMMENT_BODY = `## M02 — Onboarding self-serve de proveedores ✅

Rama: \`feat/m02-onboarding-proveedores\` (stacked sobre \`feat/m01-marketplace-proveedores\`).
Commits:
- \`1590b54\` — backend (helpers + 7 API routes + 4 email templates)
- \`9acd081\` — landing \`/para-proveedores\` + stepper registro 3 pasos + draft localStorage
- \`d2e4d80\` — panel \`/proveedor\` + admin review \`/admin/proveedores\`

### Qué quedó funcionando
- Landing pública con hero, proof points, tabla Free vs Premium, FAQ, CTA dorado.
- Registro self-serve en 3 pasos: Cuenta → Negocio → Visual (upload 1–6 fotos, validaciones, draft TTL 7 días).
- Auto-login post-registro + subida secuencial de fotos + pantalla confirmación warm.
- Admin review en \`/admin/proveedores\` con tabs por estado, acción Aprobar directo, modal Suspender con motivo enumerado + detalle.
- 4 emails Resend: bienvenida-pendiente, aprobado, suspendido, admin-nuevo (templates brand navy+dorado).
- Banners de estado en \`/proveedor\` (pendiente dorado, aprobado verde, suspendido rojo con motivo parseado).
- Analytics client-side: 6 eventos \`provider_*\` vía \`trackEvent\` + beacon de abandono.
- Utility \`.input-jurnex\` agregado a \`globals.css\`.

### Archivos creados (14)
\`\`\`
src/lib/proveedor-emails.ts
src/lib/proveedores/registro.ts
src/lib/proveedores/actualizar.ts
src/lib/proveedores/medios.ts
src/lib/proveedores/admin.ts
src/lib/proveedores/draft-registro.ts
src/app/api/proveedores/registro/route.ts
src/app/api/proveedores/me/route.ts
src/app/api/proveedores/me/medios/route.ts
src/app/api/proveedores/me/medios/[id]/route.ts
src/app/api/admin/proveedores/route.ts
src/app/api/admin/proveedores/[id]/aprobar/route.ts
src/app/api/admin/proveedores/[id]/suspender/route.ts
src/app/api/analytics/beacon/route.ts
src/app/para-proveedores/page.tsx
src/app/para-proveedores/registro/page.tsx
src/components/proveedores/RegistroProveedorFlow.tsx
src/app/proveedor/layout.tsx
src/app/proveedor/page.tsx
src/app/admin/proveedores/page.tsx
src/app/admin/proveedores/AdminProveedoresClient.tsx
\`\`\`

### Validación pendiente (manual)
- [ ] Registrar proveedor real en preview Vercel.
- [ ] Confirmar que llega email de bienvenida al proveedor y notificación al admin.
- [ ] Aprobar desde \`/admin/proveedores\` y confirmar email + visibilidad en \`/marketplace\`.
- [ ] Probar suspensión con motivo y verificar copy del email.
- [ ] Mobile iPhone: registro completo sin scroll horizontal.

### Out of scope (siguiente milestone)
Editor rico del perfil (M03), lista de leads recibidos (M06), upgrade a premium self-serve (M12).

Refs: PR stacked abierto — base \`feat/m01-marketplace-proveedores\`.
`;

async function main() {
  const issue = await findIssueByIdentifier("JUR-37");
  if (!issue) {
    console.error("❌ No se encontró JUR-37. ¿Se creó el backlog de marketplace?");
    process.exit(1);
  }

  console.log(`→ Issue: ${issue.identifier} — ${issue.title}`);
  console.log(`  Estado actual: ${issue.state.name}`);

  const states = await getStates();
  const inReview =
    states.find((s) => s.name.toLowerCase() === "in review") ||
    states.find((s) => s.type === "started") ||
    states.find((s) => s.name.toLowerCase() === "in progress");

  if (!inReview) {
    console.error("❌ No se encontró un estado 'In Review' o similar.");
    process.exit(1);
  }

  if (issue.state.name !== inReview.name) {
    await updateIssueState(issue.id, inReview.id);
    console.log(`✅ Estado → ${inReview.name}`);
  } else {
    console.log(`ℹ️  Ya estaba en ${inReview.name}`);
  }

  await addComment(issue.id, COMMENT_BODY);
  console.log("💬 Comentario agregado.");
  console.log(`🔗 ${issue.url}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
