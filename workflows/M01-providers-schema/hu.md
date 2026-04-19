# M01 — Modelo de datos real (providers, services, media, leads)

## User story

**As a** platform operator
**I want** a real relational model for providers, services, media and leads
**So that** we can replace the flat `marketplace_servicios` table and build onboarding, contact flows and analytics on top.

## Acceptance criteria

1. New tables in Postgres (Supabase):
   - `providers` — FK a `auth.users` (1 user puede ser provider), estado (`pending|approved|suspended`), plan (`free|premium`), metadata.
   - `provider_services` — FK a `providers`, categoría, nombre, descripción, precio_desde, duración estimada.
   - `provider_media` — FK a `providers` (y opcional a `provider_services`), URL en Supabase Storage, tipo (image/video), orden.
   - `provider_leads` — FK a `providers`, FK a `eventos` (opcional), FK a novio (`auth.users`), canal (`whatsapp|email`), mensaje opcional, timestamps.
   - `provider_wishlist` — FK a `eventos`, FK a `providers`, FK a `provider_services` (opcional); UNIQUE constraint.
2. Migración SQL en `supabase/` con nombre `migration_marketplace_providers.sql`.
3. RLS habilitado en todas las tablas nuevas con policies:
   - `providers`: lectura pública solo si `status = 'approved'`. Escritura solo por el owner (`auth.uid() = user_id`).
   - `provider_services` / `provider_media`: lectura pública si el provider padre está approved; escritura por owner del provider.
   - `provider_leads`: lectura solo por el provider destinatario y por el novio emisor; escritura (INSERT) por cualquier user autenticado.
   - `provider_wishlist`: CRUD por el novio dueño del evento.
4. Seed de migración elimina la tabla `marketplace_servicios` existente (mock) **solo si está vacía de datos reales**, o marca `DEPRECATED` con comentario.
5. Tipos TypeScript en `src/types/database.ts`:
   - `Provider`, `ProviderService`, `ProviderMedia`, `ProviderLead`, `ProviderWishlistItem`.
   - `ProviderStatus = "pending" | "approved" | "suspended"`.
   - `ProviderPlan = "free" | "premium"`.
6. Helper de dominio en `src/lib/providers/` con funciones puras (sin side-effects) para normalizar filtros comunes y mapear rows a view models.
7. Migración corre en staging sin errores; rollback script documentado en el mismo archivo.

## Edge cases

- User existente se registra como provider: no duplicar; crear fila en `providers` ligada a su `user_id`.
- Provider aprobado que luego se suspende: rows públicas (services/media) se ocultan inmediatamente vía RLS sin borrar data.
- Upload de media falla a mitad: tabla `provider_media` no debe quedar con URL rota; transaction que revierte.
- Novio sin evento crea wishlist: se bloquea en capa API (requiere `evento_id` válido del user).
- Duplicación de lead mismo día: constraint `UNIQUE (provider_id, evento_id, canal, day_bucket)` para evitar spam.

## Out of scope

- Agenda/availability (M9 — ver workflows/M09-provider-agenda).
- Bookings (M10).
- Reviews (M14).
- Dashboard de analytics (solo tabla + eventos crudos en este ticket).

## Dependencies

- Supabase Auth ya existente (`auth.users`).
- Supabase Storage bucket `provider-media` (crearlo como parte de la migración).
- `src/lib/supabase/server.ts` y `client.ts` ya disponibles.
- No bloquea otros MVPs; bloquea M02–M08.
