# S01 — Tech

## Factibilidad Vercel

| Enfoque | Viabilidad | Notas |
|---------|------------|--------|
| Ruta Next `/evento/[sitio_slug]` en el mismo proyecto | **Alta** | Igual que `/marketplace/[slug]`: SSR/ISR, sin cambios de infra. |
| Variables `NEXT_PUBLIC_SITE_URL` / origen canónico | Ya resuelto | `src/lib/public-origin.ts` para enlaces absolutos en emails/panel. |
| Subdominio `pareja.dominio.com` | **Media** | Wildcard en Vercel + `middleware.ts` que resuelva host → `sitio_slug`; SSL automático. |
| Dominio custom por pareja | **Baja prioridad** | API de dominios Vercel, verificación DNS, límites de plan; fase posterior. |

## Modelo de datos (propuesta)

- Columnas nuevas en `eventos` (migración idempotente):
  - `sitio_slug text unique` (nullable; índice único solo donde not null).
  - `sitio_publico_activo boolean not null default false`.
- Validación aplicación: `slugify` alineado con `src/lib/proveedores/slug.ts` (reutilizar o extraer a `lib/slug.ts` compartido).

## API / servidor

- `GET` página pública: server component lee por `sitio_slug` donde `sitio_publico_activo = true`.
- `PATCH` configuración: API route o server action con `user_is_evento_admin(evento_id)` (o política acordada).

## RLS

- Política nueva: `SELECT` en `eventos` para **anon** solo si `sitio_publico_activo` y fila coincide con slug de la ruta (o vista `v_eventos_sitio_publico` que exponga solo columnas permitidas).
- Alternativa más segura: función `security definer` que devuelve DTO público sin exponer columnas internas.

## Riesgos

- **Enumeración:** slugs predecibles; mitigar con rate limit en rutas públicas y no exponer listados.
- **Confusión con `/invitacion`:** documentar en UI y en `hu.md`.

## Referencias código

- Patrón similar: `src/app/marketplace/[slug]/page.tsx`, `obtenerProveedorPorSlug`.
