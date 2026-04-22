# AGENTS.md — Jurnex

Este archivo es el **bootstrap** para cualquier agente (Cursor, Claude Code, Codex CLI, humano onboarding) que abra este repo.

## Qué es Jurnex

Marketplace especializado en **eventos de matrimonio** (Chile → LATAM). Plataforma de dos lados:

- **Novios** (demand) — planifican su evento, gestionan invitados, mandan invitaciones digitales premium, descubren proveedores.
- **Proveedores** (supply) — fotógrafos, catering, lugar, música, flores, deco, video, coordinación. Crean perfil, reciben leads.

## Contexto producto completo

Leer primero **`docs/product-context.md`**. Incluye:

- Estado actual (qué está construido, qué falta).
- Fases del marketplace (v1 Discovery · v2 Agenda & Request · v3 Payments & Reviews).
- Modelo de monetización MVP (freemium: free con cap de leads + premium $29.990 CLP/mes).
- KPIs core por capa (supply / demand / match / revenue).
- Entidades del dominio.

## Cómo trabajar en este repo

Trabajás como **equipo multidisciplinario** cubriendo **8 roles** definidos en `agents/*.txt`:

- `agents/pm.txt` — Product Manager
- `agents/ux.txt` — UX / Product Design (flujos, fricción)
- `agents/ui.txt` — UI / Visual (jerarquía, design system, estados, “se ve bien”)
- `agents/techlead.txt` — Tech Lead
- `agents/dev.txt` — Senior Developer
- `agents/qa.txt` — QA
- `agents/data.txt` — Data / Analytics
- `agents/growth.txt` — Growth

Ante una HU no-trivial, cubre los 8 ángulos (UI puede ser breve si la HU no toca pantalla). Para HUs nuevas, crea una carpeta `workflows/<ID>-<slug>/` con los archivos del patrón (ver `.cursor/rules/jurnex-workflow.mdc`).

## Reglas duras

1. **Idioma de interacción: español LATAM neutro (tuteo)**. Chats, PRs, commits, Linear, copy UI — todo en español con tuteo neutro (tú/tienes/puedes/quieres). **Prohibido el voseo argentino** (vos/tenés/podés/querés/sumate/registrate/contanos/subí/dejá/mirá), prohibidos los modismos chilenos fuertes (bacán/pololo/cachái). El copy debe sonar igual de natural en Chile, México, Colombia y Perú.
2. **Idioma en base de datos: español**. Tablas y columnas siguen el patrón del schema (`eventos`, `invitados`, `evento_fotos`, `proveedores`, `proveedor_servicios`, `proveedor_solicitudes`, `proveedor_favoritos`, `proveedor_medios`, `v_marketplace_tarjetas`…). Enum values en español cuando es natural (`pendiente/aprobado/suspendido`, `imagen/video`, `en_app/email/whatsapp`); términos comerciales (`free`, `premium`, `trial`, `paid`) y códigos técnicos (`user_id`, `slug`, `lt-500k`) quedan en inglés. Tipos TS en `src/types/database.ts` usan los mismos nombres que la columna (`nombre_negocio`, `solicitudes_mes`, `created_at`).
3. **No tocar `/invitacion/*`** — producto en producción estable.
4. **Mobile-first siempre**.
5. **Tono warm + profesional, LATAM neutro**: tuteo (tú/puedes), evitar "Submit/Register/Upload" → "Enviar solicitud", "Crear cuenta", "Subir foto". Sin voseo, sin modismos regionales fuertes.
6. Externamente **"proveedor"** (no "provider"), **"solicitud"** (no "lead"), **"favoritos / agregar a tu evento"** (no "wishlist").
7. RLS obligatorio en toda tabla nueva. Usar funciones helper `security definer stable` (`user_is_evento_member`, `user_is_proveedor_owner`, `proveedor_es_visible`) para evitar recursión.
8. Migraciones como `supabase/migration_<tema>.sql`, idempotentes, con bloque ROLLBACK comentado al final.
9. Sin PII en analytics.
10. Sin dark patterns (scarcity fake, contadores inflados).
11. Secrets solo en `.env.local`.

## Stack

- **Next.js 14+** (App Router) + React + TypeScript.
- **Supabase** (Postgres + Auth + RLS + Storage).
- **Mercado Pago** (cobros novios + suscripción proveedor en roadmap).
- **Tailwind** con tokens navy + gold (`src/theme/panel-themes.ts`).
- **Analytics**: `trackEvent(name, props)` en `src/lib/analytics.ts`.

## Estructura del repo

```
src/
  app/                      ← rutas App Router
    panel/                  ← novios logueados
    marketplace/            ← público (MVP Semana 3)
    provider/               ← proveedores logueados (MVP)
    para-proveedores/       ← landing + registro proveedor (MVP)
    admin/providers/        ← admin review (MVP, allowlist env)
    invitacion/             ← NO TOCAR
  components/               ← por dominio (panel/, marketplace/, etc.)
  lib/                      ← helpers
    proveedores/            ← dominio marketplace supply
    analytics.ts            ← trackEvent
    guest-mission.ts        ← estado misión invitados
  types/database.ts         ← tipos Supabase (append-only)
supabase/
  migration_<tema>.sql      ← migración por feature, idempotente + rollback comentado
  schema.sql                ← baseline (no editar en PRs de feature)
workflows/                  ← documentación por HU
  <ID>-<slug>/
    hu.md ux.md ui.md tech.md data.md qa.md growth.md validation.md
agents/                     ← definición de roles
docs/
  product-context.md        ← contexto estratégico
  architecture.md           ← técnico
  chat-bootstrap.md         ← snippets para nuevos chats
scripts/
  linear-seed*.mjs          ← seeds idempotentes de Linear
```

## Convenciones

- `snake_case` en SQL/JSON API; `camelCase` en TS frontend.
- Helpers de dominio > utils genéricos.
- Server-only para DB y secrets. Nunca expongas service-role key al cliente.
- Errores: HTTP status + `{ code, message }` estructurado.
- Sin comentarios que narren qué hace el código. Solo no-obvio.

## Linear

- Team: **JUR** (id en `.env.local` como `LINEAR_TEAM_ID`).
- Cycles semanales (Lun-Dom UTC).
- Scripts de seed: `scripts/linear-seed.mjs`, `linear-seed-timeline.mjs`, `linear-seed-marketplace.mjs`. Todos idempotentes.
- Labels core: `panel`, `invitados`, `evento`, `ux`, `analytics`, `tech`, `qa`, `mobile`, `p0`, `p1`, `p2`, `marketplace`, `epic`, `supply`, `demand`, `monetizacion`.

## Sprints actuales

| Cycle | Scope | Issues |
|---|---|---|
| Semana 1 | Panel novios integración (mayormente cerrado) | JUR-1 … JUR-8 |
| Semana 2 | Timeline Premium (en curso) | JUR-23 … JUR-29 |
| Semana 3 | Marketplace MVP Discovery v1 | JUR-33 (épica), JUR-36 … JUR-43 |
| Backlog | Marketplace v2 Agenda & Request | JUR-34 (épica), JUR-44 … JUR-46 |
| Backlog | Marketplace v3 Payments & Trust | JUR-35 (épica), JUR-47 … JUR-49 |

## Primer comando útil

Para trabajar en un issue específico, leé:

1. `docs/product-context.md` (siempre).
2. `workflows/<HU>/` si existe (contiene TODO el spec).
3. El issue en Linear vía `gh` CLI o web.

Si empezás a implementar sin haber leído el workflow correspondiente, parate y leélo primero.
