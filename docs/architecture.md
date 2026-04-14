# Architecture — Wedding Events Marketplace

Este documento fija el marco técnico y de dominio para el marketplace de eventos (matrimonios). Las convenciones aplican a nuevo código y a extensiones del monorepo existente.

## Suggested stack

| Layer | Technology |
|-------|------------|
| Web app | **Next.js** (App Router, React, TypeScript) |
| Runtime / API | **Node.js** (Route Handlers, server actions donde encaje) |
| Database | **PostgreSQL** (p. ej. Supabase como host + auth opcional) |
| Payments | Integración externa (p. ej. Mercado Pago) — capa de dominio `billing` / `payments` |

## Core domain entities

Relaciones de alto nivel (el modelo físico puede normalizar en tablas adicionales).

| Entity | Purpose |
|--------|---------|
| **User** | Account for couples, providers, or staff; links to auth identity. |
| **Event** | Wedding (or event) owned by a couple; date, location, settings. |
| **Provider** | Vendor profile (business) offering services on the marketplace. |
| **Service** | Bookable offering (price, duration, category) under a provider. |
| **Booking** | Reservation of a service for an event (state machine: pending → confirmed → cancelled). |
| **Availability** | Time slots or rules when a provider/service can be booked (calendar). |
| **Review** | Post-experience rating and text tied to booking/provider/service. |

## Conventions

- **API style:** REST over HTTPS (`/api/v1/...` or domain-scoped `/api/providers/...`). Use nouns for resources; HTTP verbs for actions.
- **Naming:** `snake_case` in PostgreSQL columns, JSON bodies from backend, and path segments where idiomatic; **camelCase** in TypeScript/React props and client DTOs after mapping at the boundary.
- **Structure:** **Modular by domain** (e.g. `providers/`, `bookings/`, `events/`, `reviews/`) — each with its own types, services, and API routes; shared kernel only for cross-cutting utilities.

## Rules

1. **No duplicated business logic** — one source of truth per rule (prefer shared domain services).
2. **Reuse services** — API routes and UI server actions call the same application services, not copy-pasted queries.
3. **Clear frontend/backend separation** — UI consumes stable contracts (types + REST); DB and provider SDKs stay server-side.

## References

- Product context: `docs/product-context.md`
- Agent prompts: `/agents/*.txt`
- Workflows: `/workflows/`
