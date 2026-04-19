# Technical spec — M03 Provider panel v1

## Routes

| Path | Type | Purpose |
|---|---|---|
| `/provider` | Server component (Next App Router) | Home con KPIs |
| `/provider/perfil` | Server/client mix | Edit form |
| `/provider/servicios` | Server/client | CRUD servicios |
| `/provider/fotos` | Server/client | CRUD media |
| `/provider/solicitudes` | Server | Lista de leads |
| `/provider/plan` | Server | Info plan + CTA |

## Layout

- Crear `src/app/provider/layout.tsx` con:
  - Auth check: `user` + provider row existente → si no, redirect a `/para-proveedores`.
  - Shell propio (tipo `ProviderShell.tsx`) con tabs o bottom nav.
  - Badge de estado global (pending/suspended) como banner.

## API endpoints

| Method | Path | Body/Query | Notes |
|---|---|---|---|
| GET | `/api/providers/me` | — | Devuelve provider + services + media count |
| PATCH | `/api/providers/me` | `Partial<Provider>` | Auto-save fields |
| POST | `/api/providers/me/services` | `ProviderService` (sin id) | Crea |
| PATCH | `/api/providers/me/services/:id` | `Partial<ProviderService>` | Edita |
| DELETE | `/api/providers/me/services/:id` | — | Soft delete (is_active=false) preferido |
| POST | `/api/providers/me/services/reorder` | `[{id, sort_order}]` | Batch reorder |
| POST | `/api/providers/me/media` | FormData | Crea (ver M02 tech) |
| PATCH | `/api/providers/me/media/:id` | `{alt, sort_order}` | Edita metadata |
| DELETE | `/api/providers/me/media/:id` | — | Borra storage + row |
| GET | `/api/providers/me/leads` | `?from=&to=&channel=` | Lista con filtros |
| GET | `/api/providers/me/kpis` | `?range=30d` | Views + leads + conv |

## Server actions alternative

Dado que es panel interno, puede usarse Next.js server actions para simplificar boilerplate:

- `src/app/provider/_actions/update-profile.ts`
- `src/app/provider/_actions/create-service.ts`
- etc.

Preferir route handlers para los que hacen upload (media) por DX.

## KPIs view

Crear vista SQL materializada (refresh nightly) o query on-the-fly:

```sql
-- views/provider_kpis_30d.sql
create or replace view provider_kpis_30d as
select
  p.id as provider_id,
  (select count(*) from provider_views v where v.provider_id = p.id and v.created_at > now() - interval '30 days') as views_30d,
  (select count(*) from provider_leads l where l.provider_id = p.id and l.created_at > now() - interval '30 days') as leads_30d
from providers p;
```

**Nota:** tabla `provider_views` no existe todavía. Ver `data.md` para evento de vista; si decidimos persistirlo, crear tabla simple `provider_views (provider_id, session_id, created_at)` con dedup por día.

## Auto-save implementation

```ts
// src/hooks/useAutoSave.ts
export function useAutoSave<T>(
  value: T,
  save: (v: T) => Promise<void>,
  delay = 800,
): { status: "idle" | "saving" | "saved" | "error" } {
  // Debounce + status state
}
```

UI: pequeño indicador top-right del form "Guardado ✓" / "Guardando…" / "Error, reintentar".

## Plan cap enforcement (fotos)

- Backend chequea: si `provider.plan === 'free'` y count(media) ≥ 6 → 403 con `code: "plan_cap_reached"`.
- Frontend muestra modal upsell.

## Performance

- `/provider` home: single query al bundle (provider + counts agregados).
- Media grid: lazy-load con `next/image` y `sizes` apropiados.
- Leads: paginación cursor si > 100 leads (MVP: limit 50).

## Risks

- **Views counting sin persistencia:** si solo usamos GA, no podemos mostrar en panel interno. Decidir: tabla `provider_views` o fetch GA API. MVP recomendado: tabla propia ligera.
- **Race en drag-reorder:** el usuario drag 2x rápido; API debe aceptar último state completo no diff.
- **Upload concurrente:** múltiples fotos a la vez; limitar a 3 concurrent con cola client-side.
