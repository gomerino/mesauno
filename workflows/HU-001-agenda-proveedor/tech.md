# Technical spec — HU-001 Provider agenda & availability

## Domain

- **Availability** records tie to `provider_id` and optionally `service_id` (if per-service overrides).
- Store instants in **UTC**; API accepts ISO 8601; UI formats local timezone.

## REST sketch (English paths, snake_case JSON from API)

| Method | Resource | Description |
|--------|----------|-------------|
| `GET` | `/api/providers/:id/availability?service_id=&from=&to=` | List slots or rules in range for couple UI. |
| `GET` | `/api/provider/availability` | Provider’s own rules/slots (auth). |
| `PUT` | `/api/provider/availability` | Replace or patch rules (auth; provider role). |

## Booking validation

- `POST /api/bookings` must re-check slot still free (transaction or row lock) to prevent double booking.

## Modules

- `availability/` — generation of slots from rules (if using patterns).
- `bookings/` — depends on availability service, not duplicated SQL in routes.

## Migrations

- Add `availability` (and related) tables per Tech Lead review; forward-only migrations in `supabase/` or project convention.
