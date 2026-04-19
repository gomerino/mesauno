# Analytics — M01 Providers schema

## Events (backend emission)

| Event name | When | Properties |
|---|---|---|
| `provider_registered` | INSERT en `providers` (status=pending) | `provider_id`, `user_id`, `primary_category`, `region` |
| `provider_approved` | UPDATE status → 'approved' | `provider_id`, `reviewer_user_id`, `time_to_approve_hours` |
| `provider_suspended` | UPDATE status → 'suspended' | `provider_id`, `reason_code` |

Estos eventos se emiten desde **backend** (API route o trigger SQL que escribe a una tabla `analytics_events` y un job los exporta, o directo a Google Analytics 4 Measurement Protocol).

## Base metrics enabled

- `active_providers_by_category` — count WHERE status='approved' GROUP BY primary_category.
- `providers_funnel` — pending → approved → active (al menos 1 lead o servicio visible últimos 30d).
- `avg_time_to_approve_hours` — AVG(approved_at - created_at) WHERE approved_at NOT NULL.

## Quality rules

- Eventos sin PII (ni emails, ni nombres).
- Usar solo IDs UUID + enums.
- Versionar con prefijo `v1_` en el futuro si cambia shape.

## Data dictionary preview (para dashboards)

| Tabla | Para analytics |
|---|---|
| `providers` | dimensión principal; status + plan + category |
| `provider_leads` | medida principal de demanda |
| `provider_wishlist` | intención (leading indicator de lead) |
| `provider_media` | calidad supply (≥3 fotos correlaciona con lead) |
