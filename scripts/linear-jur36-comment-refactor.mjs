#!/usr/bin/env node
/**
 * Comenta en JUR-36 el refactor de naming a español (post-review).
 * Idempotente: solo agrega un comentario nuevo; no cambia estado.
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
if (!API_KEY || !TEAM_ID) throw new Error("Faltan LINEAR_API_KEY o LINEAR_TEAM_ID");

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

async function findIssue(identifier) {
  let after = null;
  for (let i = 0; i < 10; i++) {
    const data = await gql(
      `query($teamId: ID!, $after: String) {
        issues(first: 100, after: $after, filter: { team: { id: { eq: $teamId } } }) {
          pageInfo { hasNextPage endCursor }
          nodes { id identifier url }
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
  "### Ajuste de convención — naming en español 🔁",
  "",
  "Refactor para alinearse con el estándar del schema existente (`eventos`, `invitados`, `evento_fotos`…) y con la regla de interacción en español LATAM.",
  "",
  "**Renombrado BD:**",
  "",
  "| Antes | Ahora |",
  "|---|---|",
  "| `providers` | `proveedores` |",
  "| `provider_services` | `proveedor_servicios` |",
  "| `provider_media` | `proveedor_medios` |",
  "| `provider_leads` | `proveedor_solicitudes` |",
  "| `provider_wishlist` | `proveedor_favoritos` |",
  "| `v_marketplace_cards` | `v_marketplace_tarjetas` |",
  "| bucket `provider-media` | `proveedor-medios` |",
  "| `user_owns_provider()` | `user_is_proveedor_owner()` |",
  "| `provider_is_visible()` | `proveedor_es_visible()` |",
  "",
  "**Columnas traducidas**: `business_name→nombre_negocio`, `tagline→eslogan`, `bio→biografia`, `city→ciudad`, `primary_category→categoria_principal`, `status→estado`, `phone→telefono`, `website→sitio_web`, `leads_this_month→solicitudes_mes`, `plan_capped→limitado_por_plan`, `day_bucket→dia_solicitud`, `channel→canal`, `message→mensaje`, `sender_user_id→remitente_user_id`, `added_by→agregado_por`, `kind→tipo`, `public_url→url_publica`, `sort_order→orden`, `is_active→activo`, `hero_image_url→imagen_hero_url`, `media_count→medios_count`, etc.",
  "",
  "**Enum values** (en español cuando es natural): `pending/approved/suspended → pendiente/aprobado/suspendido`, `image → imagen`, `in_app → en_app`. Mantengo `free/premium` y códigos técnicos (`lt-500k`) en inglés.",
  "",
  "**Renombrado código:**",
  "",
  "- `supabase/migration_marketplace_providers.sql` → `migration_marketplace_proveedores.sql`.",
  "- `src/lib/providers/` → `src/lib/proveedores/`. Archivos: `constants.ts`, `slug.ts`, `queries.ts`, `solicitudes.ts` (antes `leads.ts`), `favoritos.ts` (antes `wishlist.ts`).",
  "- Tipos en `src/types/database.ts`: `Provider→Proveedor`, `ProviderService→ProveedorServicio`, `ProviderMedia→ProveedorMedio`, `ProviderLead→ProveedorSolicitud`, `ProviderWishlistItem→ProveedorFavorito`, `MarketplaceCard→MarketplaceTarjeta`.",
  "- Helpers TS en español: `createLead→crearSolicitud`, `addToWishlist→agregarFavorito`, `listMarketplaceCards→listarTarjetasMarketplace`, `getProviderBySlug→obtenerProveedorPorSlug`, etc.",
  "- `scripts/seed-providers-dummy.mjs` → `seed-proveedores-dummy.mjs`.",
  "",
  "**Contexto global actualizado:**",
  "",
  "- `AGENTS.md` — reglas 1 y 2 explícitas sobre idioma de interacción (español LATAM) e idioma de BD.",
  "- `.cursor/rules/jurnex-roles.mdc` — mismas reglas en el `alwaysApply`, más excepciones documentadas (términos comerciales consolidados y códigos técnicos).",
  "",
  "**Checks:**",
  "",
  "- `tsc --noEmit` → exit 0.",
  "- Sin lints.",
  "- Sin imports externos rotos (solo teníamos referencias internas al módulo nuevo).",
].join("\n");

async function main() {
  const issue = await findIssue("JUR-36");
  if (!issue) throw new Error("JUR-36 no encontrada");
  await gql(
    `mutation($input: CommentCreateInput!) {
      commentCreate(input: $input) { success }
    }`,
    { input: { issueId: issue.id, body: BODY } },
  );
  console.log("✓ comentario agregado en JUR-36");
  console.log(issue.url);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
