# PRODUCT CONTEXT

## Tipo de producto
Marketplace especializado en eventos de matrimonio (Chile → LATAM).
Plataforma de dos lados: **novios** planifican su evento y **proveedores** (fotografía, catering, música, lugar, flores, deco, etc.) ofrecen sus servicios.

## Usuarios
- **Novios** (demand-side, usuario principal hoy).
- **Proveedores** (supply-side, principal en roadmap marketplace).
- Staff / check-in (secundario, solo día del evento).

## Propuesta de valor
Organiza tu matrimonio completo en un solo lugar:
- Crear el evento y gestionar invitados.
- Enviar invitaciones digitales premium (boarding pass aesthetic).
- Descubrir y contactar proveedores de confianza.
- Coordinar el día (programa, check-in, experiencia en vivo).

## Estado actual

### Construido
- Onboarding + demo de invitación.
- Panel novios (`/panel`) con journey (Check-in → Despegue → En vuelo).
- Sistema de invitación premium (`/invitacion/[token]`) — **NO TOCAR**.
- Flujo de pago plan novios (Mercado Pago, plan Esencial $19.990 / plan Experiencia $34.990).
- Marketplace básico (`/marketplace`) con listado plano — listo para evolucionar a v1.

### Por construir (marketplace)
- Modelo de datos real (providers, services, media, bookings).
- Panel proveedor self-serve.
- Detalle de proveedor con portfolio.
- Contacto directo novios → proveedor con tracking.
- Plan premium proveedor (upsell).
- Agenda + booking request (fase 2).
- Payments + reviews (fase 3).

## Reglas
- NO modificar `/invitacion/*`.
- Mobile-first siempre.
- Mantener arquitectura modular por dominio.
- Priorizar simplicidad y claridad UX sobre features.
- Toda decisión de copy debe ser warm, no transaccional (evitar "contratar", "reservar" en favor de "agregar a mi viaje", "conocer más").

## Stack
- Next.js (App Router, React, TypeScript).
- Supabase (PostgreSQL + Auth + RLS + Storage).
- Mercado Pago (cobros novios; cobros proveedor vía suscripción en roadmap).
- Analytics: `trackEvent` helper en `src/lib/analytics.ts` → gtag / dataLayer / CustomEvent.

## Entidades clave del dominio
- **User** — cuenta (auth.users); puede ser novio y/o proveedor (flag en tabla asociada).
- **Event (`eventos`)** — boda; dueño = novios; `plan_status` (trial/paid/expired).
- **Provider** — perfil de proveedor; FK a `auth.users`; estado (pending/approved/suspended); plan (free/premium).
- **Service** — oferta bookable (categoría, precio desde, media); FK a Provider.
- **Lead** — contacto novio → proveedor (MVP); tipo (whatsapp/email); incluye contexto evento.
- **Booking** — reserva confirmada (fase 2); estado (pending/confirmed/cancelled).
- **Availability** — reglas/slots de proveedor (fase 2).
- **Review** — rating + texto post-evento (fase 3).
- **Wishlist** — "agregar a mi evento" (link novio → provider/service).

## Estrategia marketplace

### Fases
| Fase | Nombre | Scope | Revenue | Duración estimada |
|---|---|---|---|---|
| v1 | Discovery | Proveedores listan, novios contactan por WhatsApp/email | Listing fee freemium | 4–6 semanas |
| v2 | Agenda & Request | Proveedores exponen agenda, novios solicitan reserva | + upsells premium | 3–4 semanas |
| v3 | Payments & Reviews | Señal/anticipo en plataforma, reviews post-evento | + take rate opcional | 4–6 semanas |

### Modelo de monetización MVP (fase 1)
- **Proveedor Free:** perfil + hasta 3 leads/mes + 6 fotos portfolio.
- **Proveedor Premium ($29.990 CLP/mes):** destacado, leads ilimitados, portfolio ilimitado, analytics, badge "Verificado ✈️", prioridad en ranking.
- **Novios:** acceso completo a marketplace es gratis. El plan Experiencia ($34.990 one-time) no incluye nada del marketplace directamente en v1.

### KPIs core
| Nivel | Métrica | Cómo se calcula |
|---|---|---|
| Supply | `active_providers` | providers con estado approved y última actividad ≤ 30d |
| Supply | `premium_conversion_rate` | premium / (free + premium) |
| Demand | `marketplace_visitors` | sesiones únicas en `/marketplace*` |
| Demand | `lead_submitted_rate` | leads creados / provider_viewed |
| Match | `avg_leads_per_provider_month` | guardrail supply ≥ 2 |
| Match | `time_to_first_lead_h` | tiempo aprobación → primer lead |
| Revenue | `mrr_providers` | suma suscripciones activas |

## Prioridades actuales (próximos 3 sprints)
1. **Semana 2 (activo):** Timeline premium del panel novios (JUR-23 a JUR-29).
2. **Semana 3:** Marketplace Discovery v1 — MVP (épica JUR-M, HUs M1–M8 con P0/P1).
3. **Semana 4:** Cerrar v1 + empezar fase 2 (agenda + booking request).

## Referencias
- Arquitectura técnica: `docs/architecture.md`.
- Agentes por rol: `/agents/*.txt`.
- Workflows por HU: `/workflows/`.
- Seed Linear: `scripts/linear-seed*.mjs`.
