#!/usr/bin/env node
/**
 * Linear seed — Timeline Premium (Semana 2).
 *
 * Crea:
 *  - Cycle "Semana 2 — Timeline Premium" (2026-04-20 → 2026-04-26).
 *  - Labels nuevos: monetizacion, content, p2.
 *  - Issues T9–T13, T15, T16 (T14 fue mergeada en T9).
 *
 * Idempotente: reutiliza labels/cycles/issues por nombre/título.
 *
 * Uso:  node scripts/linear-seed-timeline.mjs
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
    `
    query($id: String!) {
      team(id: $id) {
        id key name
        states { nodes { id name type } }
        labels { nodes { id name } }
        cycles { nodes { id name startsAt endsAt } }
      }
    }
  `,
    { id: TEAM_ID },
  );
  return data.team;
}

async function ensureLabel(existing, name, color) {
  const hit = existing.find((l) => l.name.toLowerCase() === name.toLowerCase());
  if (hit) return hit.id;
  const data = await gql(
    `
    mutation($name: String!, $color: String!, $teamId: String!) {
      issueLabelCreate(input: { name: $name, color: $color, teamId: $teamId }) {
        success issueLabel { id name }
      }
    }
  `,
    { name, color, teamId: TEAM_ID },
  );
  return data.issueLabelCreate.issueLabel.id;
}

async function ensureCycle(existingCycles, name, startsAt, endsAt) {
  const hit = existingCycles.find((c) => c.name === name);
  if (hit) return hit;
  const data = await gql(
    `
    mutation($input: CycleCreateInput!) {
      cycleCreate(input: $input) {
        success cycle { id name startsAt endsAt }
      }
    }
  `,
    { input: { teamId: TEAM_ID, name, startsAt, endsAt } },
  );
  return data.cycleCreate.cycle;
}

async function listAllIssueTitles() {
  const titles = new Map();
  let after = null;
  for (let i = 0; i < 10; i++) {
    const data = await gql(
      `
      query($teamId: ID!, $after: String) {
        issues(first: 100, after: $after, filter: { team: { id: { eq: $teamId } } }) {
          pageInfo { hasNextPage endCursor }
          nodes { id identifier title url }
        }
      }
    `,
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
    `
    mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success issue { id identifier title url }
      }
    }
  `,
    { input: payload },
  );
  const issue = data.issueCreate.issue;
  existing.set(issue.title, issue);
  return { ...issue, reused: false };
}

async function assignIssueToCycle(issueId, cycleId) {
  await gql(
    `
    mutation($id: String!, $cycleId: String!) {
      issueUpdate(id: $id, input: { cycleId: $cycleId }) { success }
    }
  `,
    { id: issueId, cycleId },
  );
}

function desc(parts) {
  return parts.join("\n");
}

const LABEL_SPEC = [
  ["monetizacion", "#FBBF24"],
  ["content", "#D946EF"],
  ["p2", "#94A3B8"],
];

const ISSUES = [
  {
    title: "T9 — Timeline premium en JourneyPhasesBar (core visual)",
    priority: 2,
    state: "Todo",
    labels: ["panel", "ux", "p1"],
    cycle: "now",
    description: desc([
      "## Objetivo",
      "Transformar la botonera Check-in → Despegue → En vuelo en una línea de tiempo con jerarquía visual clara, acabados premium dorados y lenguaje visual coherente con la invitación (boarding pass).",
      "",
      "## Alcance",
      "- Render timeline horizontal con 3 hitos (círculos) y línea conectora.",
      "- Estados por hito:",
      "  - past: filled dorado #D4AF37 con check blanco stroke 3.",
      "  - current: anillo dorado con glow pulsante (shadow 0 0 26px rgba(212,175,55,0.35)) y ping interno.",
      "  - future: outline slate, fill transparente, número/ícono en slate-500.",
      "  - locked: outline dashed dorado 40% opacity + candado dim #8B6F1F/60.",
      "- Línea conectora:",
      "  - past→current: foil gradient (#8B6F1F → #D4AF37 → #E8C547), 2.5px.",
      "  - current→future: dashed slate-500/30.",
      "  - future→locked: dashed dorado dim.",
      "- Avión SVG animado (reutiliza el de JourneyHeader) con spring al cambiar fase.",
      "- Fondo: bg-white/[0.04] + radial-gradient dorado sutil arriba.",
      "- Eyebrows nuevos (agregar PHASE_EYEBROW a src/lib/journey-phases.ts): PREPARATIVOS / TU GRAN DÍA / EXPERIENCIA ✨.",
      "- Labels existentes: Check-in / Despegue / En vuelo (no cambiar).",
      "- Subtextos: PHASE_OBJECTIVE actual (sin cambios).",
      "- Markup semántico stepper: <ol> + aria-current=\"step\".",
      "",
      "## DoD",
      "- Sin regresión de navegación a /panel/evento, /panel/programa, /panel/experiencia.",
      "- Funciona con los 3 temas (relax/fiesta/intimo) vía usePanelJourneyTheme, fiesta como default.",
      "- Lighthouse a11y ≥ 95.",
      "- Mobile 360px y desktop 1440px sin overflow.",
      "- Sin CLS al cargar.",
      "",
      "## Métrica",
      "- panel_phase_clicked (CTR entre fases).",
      "- time_to_next_phase.",
      "",
      "## No incluye",
      "- Rediseño de JourneyHeader / JourneyProgress.",
      "- Gating premium (T11).",
      "- Mobile hero+satélites (T13).",
    ]),
  },
  {
    title: "T10 — Tokens dorados y tematización del timeline",
    priority: 2,
    state: "Todo",
    labels: ["panel", "ux", "tech", "p1"],
    cycle: "now",
    description: desc([
      "## Objetivo",
      "Mover #D4AF37 hardcoded a tokens y centralizar helper de plan status. Limpieza de deuda.",
      "",
      "## Alcance",
      "- Paleta dorada oficial en panel-themes.ts:",
      "  - goldDim: #8B6F1F (locked, eyebrow dim).",
      "  - goldBase: #D4AF37 (active, línea foil base).",
      "  - goldHighlight: #E8C547 (labels activos, highlight foil).",
      "- Función journeyTimelineAccentClasses(theme) → { trackBase, trackActive, nodeDone, nodeCurrent, nodeFuture, nodeLocked, labelActive, planeColor, eyebrowActive }.",
      "- Reemplazar #D4AF37 hardcoded en JourneyProgress.tsx y JourneyPhasesBar.tsx por tokens.",
      "- Crear src/lib/plan-status.ts con:",
      "  - export const PLAN_PAID = \"paid\";",
      "  - export function isPlanActive(status: string | null | undefined): boolean;",
      "- Reemplazar duplicados en JourneyHome.tsx:25 y JourneyPrimaryCta.tsx:21 por el import.",
      "- Evaluar JourneyProgress.tsx (huérfano, 0 consumidores): marcar deprecated o eliminar.",
      "- Doc corta en panel-themes.md.",
      "",
      "## DoD",
      "- Cero ocurrencias nuevas de #D4AF37 fuera de panel-themes.ts.",
      "- Cero duplicados de isPlanActive.",
      "- Los 3 temas cambian coherentemente desde PanelThemeSelector.",
      "- grep \"plan_status === \\\"paid\\\"\" muestra solo usos indirectos vía helper.",
      "",
      "## Métrica",
      "- (tech debt)",
      "",
      "## No incluye",
      "- Temas nuevos (T15).",
      "- Color picker libre.",
    ]),
  },
  {
    title: "T11 — Gating premium del hito En vuelo",
    priority: 2,
    state: "Todo",
    labels: ["panel", "ux", "monetizacion", "p1"],
    cycle: "now",
    description: desc([
      "## Objetivo",
      "Convertir el hito En vuelo en hook de upsell al plan Experiencia, sin romper el flujo para quienes pagaron.",
      "",
      "## Alcance",
      "- Sin plan Experiencia (isPlanActive(plan_status) === false):",
      "  - Nodo con candado dorado dim #8B6F1F/60.",
      "  - Desktop: tooltip hover \"Desbloquea la experiencia en vivo\".",
      "  - Mobile <768px: bottom sheet al tocar el candado.",
      "  - Click abre PaywallModal con CTA al checkout plan Experiencia ($34.990 CLP).",
      "  - Eyebrow + subtext \"DESBLOQUEA CON EXPERIENCIA\".",
      "- Con plan Experiencia:",
      "  - Sparkle dorado ✦ (microceremonia en T16).",
      "  - Subtext \"DESBLOQUEADO\".",
      "- Respetar optimisticPlanActive (ver JourneyHome.tsx:51) para no mostrar candado tras checkout exitoso.",
      "- Admin check (user_is_evento_admin RPC):",
      "  - Admin: click abre PaywallModal y checkout.",
      "  - No admin: click abre modal \"Pide a [nombre_novio] activar Experiencia\" con link de compartir.",
      "- Reutilizar JourneyUnlockBanner solo bajo la timeline, sin duplicar paywall.",
      "- Eventos nuevos:",
      "  - phase_lock_clicked { phase_id, is_admin }",
      "  - phase_lock_ask_admin_shown",
      "  - phase_unlocked_celebration_shown (compartido con T16)",
      "",
      "## DoD",
      "- Flow admin: free → candado → click → PaywallModal → checkout → vuelta → nodo desbloqueado (sin flicker gracias a optimisticPlanActive).",
      "- Flow no-admin: modal \"pide al organizador\", sin checkout.",
      "- No se muestra doble paywall si ya pagó.",
      "- Mobile sin tooltip roto.",
      "- Tests manuales en /panel/evento, /panel/programa, /panel/experiencia.",
      "",
      "## Métrica",
      "- phase_lock_clicked_rate.",
      "- Conversion phase_lock_clicked → checkout_completed.",
      "- % de no-admins que comparten el link de \"pide al organizador\".",
      "",
      "## No incluye",
      "- Cambios al PaywallModal actual.",
      "- Cambios al pricing.",
      "- Microceremonia post-pago (T16).",
    ]),
  },
  {
    title: "T13 — Versión mobile del timeline: hero + satélites",
    priority: 2,
    state: "Todo",
    labels: ["panel", "mobile", "ux", "p1"],
    cycle: "now",
    description: desc([
      "## Objetivo",
      "En ≤640px, layout hero + satélites: fase actual grande centrada, otras dos chicas como satélites. Decidido tras validación visual con mockup (descartado scroll horizontal).",
      "",
      "## Alcance",
      "- Layout vertical compacto:",
      "  - Eyebrow + label grande dorado arriba (fase actual).",
      "  - Nodo hero 96px centrado con glow expandido.",
      "  - 2 mini-nodos satélites abajo-izquierda y abajo-derecha.",
      "  - Líneas conectoras curvas hero ↔ satélites.",
      "  - PHASE_OBJECTIVE en slate-400 debajo.",
      "  - 3 dots indicadores al final (past dim, current base, future/locked slate).",
      "- Touch targets ≥44px.",
      "- Haptic suave al tocar satélite (navigator.vibrate si existe, graceful degrade).",
      "- Dentro de PanelMobileChrome sin tocar PanelShell.",
      "",
      "## DoD",
      "- 360px sin overflow.",
      "- Hero visible completo en viewport 640x800.",
      "- Satélites clickables con navegación correcta.",
      "- Respeta prefers-reduced-motion.",
      "",
      "## Métrica",
      "- bounce rate en /panel/* desde mobile.",
      "- phase_navigation_mobile clicks.",
      "",
      "## No incluye",
      "- Refactor PanelMobileChrome.",
      "- Scroll horizontal fallback (descartado).",
    ]),
  },
  {
    title: "T12 — Microinteracciones premium (avión + glow + foil)",
    priority: 3,
    state: "Backlog",
    labels: ["panel", "ux", "p2"],
    description: desc([
      "## Objetivo",
      "Que la barra se sienta cara sin ser pesada ni ruidosa.",
      "",
      "## Alcance",
      "- Avión anima A → B con spring al cambiar phase.",
      "- Glow pulsante (animate-journeyGlowPulse) solo en hito current.",
      "- Foil gradient animado muy lento (8s loop) en borde del nodo activo.",
      "- Trail dorado suave detrás del avión en movimiento.",
      "- Respeta prefers-reduced-motion: snap directo del avión, sin pulsaciones ni foil animado.",
      "",
      "## DoD",
      "- 60fps en iPhone 12 / Pixel 5 (DevTools Performance).",
      "- prefers-reduced-motion honrado.",
      "- Sin CLS.",
      "",
      "## Métrica",
      "- (perceptual)",
      "",
      "## No incluye",
      "- Rediseño de otros componentes.",
    ]),
  },
  {
    title: "T16 — Microceremonia de desbloqueo post-pago",
    priority: 3,
    state: "Backlog",
    labels: ["panel", "ux", "monetizacion", "p2"],
    description: desc([
      "## Objetivo",
      "Deleite post-pago: el candado se transforma en sparkle con animación celebratoria, reforzando la decisión de compra.",
      "",
      "## Alcance",
      "- Detectar flag desde PanelPostPaymentSuccess o localStorage jurnex_just_unlocked.",
      "- Animación ~1.8s:",
      "  1. Candado fade + translateY down.",
      "  2. Burst de 5-8 sparkles dorados.",
      "  3. Sparkle ✦ scale 0→1 + rotate desde el centro.",
      "  4. Glow dorado expansivo one-shot.",
      "- Limpiar flag post-animación (no repetir en futuras visitas).",
      "- Respeta prefers-reduced-motion: skip animación, sparkle directo.",
      "- Evento phase_unlocked_celebration_shown { duration_ms }.",
      "",
      "## DoD",
      "- Corre exactamente una vez post-checkout exitoso.",
      "- No corre si usuario ya tenía plan Experiencia.",
      "- No corre en cada visita.",
      "- Si PanelPostPaymentSuccess no monta: fallback vía flag localStorage sin crash.",
      "",
      "## Métrica",
      "- phase_unlocked_celebration_shown count ≈ checkout_completed count.",
      "",
      "## No incluye",
      "- Sonido.",
      "- Confetti full-screen.",
    ]),
  },
  {
    title: "T15 — Personalización premium del acento dorado",
    priority: 3,
    state: "Backlog",
    labels: ["panel", "ux", "monetizacion", "p2"],
    description: desc([
      "## Objetivo",
      "Perk exclusivo Experiencia: pareja elige tono dorado (clásico / champagne / rose gold).",
      "",
      "## Alcance",
      "- 3 presets:",
      "  - Clásico #D4AF37.",
      "  - Champagne #E8D48F.",
      "  - Rose gold #E8B4A0.",
      "- Extender panel-journey-theme-context con premiumGoldVariant.",
      "- Selector visible solo si isPlanActive(plan_status), dentro de PanelThemeSelector.",
      "- Persistir en Supabase: columna panel_theme_variant en eventos.",
      "- Aplicar a timeline, header, nav activo, banner premium.",
      "",
      "## DoD",
      "- Free: preset clásico fijo (no ve selector).",
      "- Experiencia: selector visible, cambio instantáneo y persistente.",
      "- Cero regresión en temas existentes (relax/fiesta/intimo).",
      "",
      "## Métrica",
      "- % usuarios Experiencia que personalizan.",
      "- % que cambian más de 1 vez.",
      "",
      "## No incluye",
      "- Color picker libre.",
      "- Más de 3 presets.",
    ]),
  },
];

async function main() {
  console.log("→ Obteniendo contexto del team…");
  const team = await getTeamContext();
  const stateByName = new Map(team.states.nodes.map((s) => [s.name, s.id]));
  if (!stateByName.get("Todo") || !stateByName.get("Backlog")) {
    throw new Error("Estados Todo/Backlog no encontrados");
  }

  console.log("→ Asegurando labels nuevos…");
  const labelsNow = [...team.labels.nodes];
  const labelIdByName = new Map(labelsNow.map((l) => [l.name, l.id]));
  for (const [name, color] of LABEL_SPEC) {
    const id = await ensureLabel(labelsNow, name, color);
    labelIdByName.set(name, id);
    if (!labelsNow.find((l) => l.id === id)) labelsNow.push({ id, name });
  }
  for (const l of team.labels.nodes) if (!labelIdByName.has(l.name)) labelIdByName.set(l.name, l.id);

  console.log("→ Asegurando cycle Semana 2…");
  const cycle = await ensureCycle(
    team.cycles.nodes,
    "Semana 2 — Timeline Premium",
    "2026-04-20T00:00:00.000Z",
    "2026-04-26T23:59:59.000Z",
  );

  console.log("→ Leyendo issues existentes…");
  const existing = await listAllIssueTitles();

  const byBucket = { now: [], next: [], later: [] };

  for (const spec of ISSUES) {
    const stateId = stateByName.get(spec.state);
    const labelIds = spec.labels.map((n) => labelIdByName.get(n)).filter(Boolean);
    const missingLabels = spec.labels.filter((n) => !labelIdByName.get(n));
    if (missingLabels.length) {
      console.warn(`  ⚠ labels faltantes para ${spec.title}: ${missingLabels.join(", ")}`);
    }
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
      byBucket.now.push(issue);
    } else if (spec.title.startsWith("T15")) {
      byBucket.later.push(issue);
    } else {
      byBucket.next.push(issue);
    }

    const tag = issue.reused ? "(reusado)" : "(nuevo)";
    console.log(`  ${issue.identifier}  ${tag}  ${issue.title}`);
  }

  console.log("\n=== Resumen ===");
  console.log(`Cycle: ${cycle.name} (${cycle.id})`);
  console.log(`Fechas: ${cycle.startsAt} → ${cycle.endsAt}`);
  console.log(`\nNOW (Semana 2):`);
  for (const i of byBucket.now) console.log(`  ${i.identifier}  ${i.url}`);
  console.log(`\nNEXT (sin cycle):`);
  for (const i of byBucket.next) console.log(`  ${i.identifier}  ${i.url}`);
  console.log(`\nLATER:`);
  for (const i of byBucket.later) console.log(`  ${i.identifier}  ${i.url}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
