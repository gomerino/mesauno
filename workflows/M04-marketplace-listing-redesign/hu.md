# M04 — Rediseño del listado `/marketplace`

## User story

**As a** novio/a planeando mi matrimonio
**I want** un marketplace premium donde descubrir proveedores por categoría, región y estilo
**So that** puedo formar el equipo de mi evento con confianza y sin overwhelm.

## Acceptance criteria

1. `/marketplace` lee desde `providers` (M01) con status=`approved`, reemplazando `marketplace_servicios`.
2. UI premium alineada con estética gold-navy (BoardingPass aesthetic):
   - Hero corto con copy warm + ilustración o imagen navy/gold.
   - Filtros sticky: categoría, región, rango precio (opcional), badge "Premium" / "Nuevo".
   - Grid de cards responsive (1 col mobile, 2 tablet, 3 desktop).
3. Cada card muestra:
   - Foto destacada (aspect 4:3 o 1:1 consistente).
   - Business name, tagline, primary_category (badge), región.
   - Precio desde (si hay) o "Consultar".
   - Badge `Premium ✈️` si `plan === 'premium'`.
   - Click → `/marketplace/[slug]` (M05).
4. Filtros:
   - Categoría: chips horizontales scrolable arriba.
   - Región: dropdown.
   - Precio: dropdown rangos predefinidos (`< 500k`, `500k–1M`, `1M–3M`, `> 3M`).
   - Orden: `Destacados` (default: premium primero, luego recientes con ≥3 fotos), `Más nuevos`, `Precio ascendente`.
5. URL refleja filtros con query params (`?categoria=fotografia&region=rm`) para compartibilidad y SEO.
6. Paginación o infinite scroll (infinite scroll recomendado para mobile, con "mostrar más" botón fallback).
7. Estado empty: mensaje warm + CTA "Limpiar filtros".
8. Estado loading: skeleton cards (no spinner opaco).
9. SEO: `<title>` y `<meta description>` dinámicos según filtros; Open Graph con foto genérica.
10. Performance: LCP < 2.5s en mobile 4G; imágenes con `next/image` + lazy loading.

## Edge cases

- Categoría sin providers: copy "Pronto habrá proveedores de [categoría] en [región]. Dejanos tu interés" + email capture opcional.
- Provider premium sin fotos: no romper layout; usar placeholder gradient dorado-navy.
- Filtros combinados que dan 0 resultados: sugerir quitar 1 filtro.
- Bot scraping (todos los datos son públicos): rate limit básico a nivel edge.

## Out of scope

- Búsqueda por texto libre (M08 — search & filters v2).
- Filtros por fecha de disponibilidad (M09 — requiere agenda).
- Favoritos sin login (M07).
- Ordenamiento por rating (M14 — requiere reviews).

## Dependencies

- M01 schema.
- M05 (detalle) idealmente en paralelo para que el click tenga destino real. MVP: puede ir primero M04 con detalle muy simple y luego refinar en M05.
