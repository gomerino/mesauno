# M05 — Página detalle `/marketplace/[slug]`

## User story

**As a** novio/a evaluando proveedores
**I want** una página detalle rica con portfolio, servicios y contacto directo
**So that** puedo tomar una decisión informada y contactar al proveedor con confianza.

## Acceptance criteria

1. Ruta `/marketplace/[slug]` renderiza proveedor approved (404 si no existe o no approved).
2. Estructura de la página:
   - **Hero** con foto destacada grande (o collage) + business_name + tagline + badges (`Premium ✈️`, `Nuevo`, `primary_category`, `region`).
   - **Portfolio** — galería de fotos con lightbox; mobile carrusel con snap.
   - **Sobre [nombre]** — bio.
   - **Servicios** — lista de `provider_services` activos, con nombre, descripción corta, precio desde, duración.
   - **Contacto** — CTA primario "Solicitar contacto" (abre modal M06) + secundarios: WhatsApp, email, instagram, web (si tiene).
   - **Agregar a mi evento** — CTA secundario (wishlist) si user logueado con evento.
3. Sticky CTA en mobile: barra bottom con "Contactar" + "Guardar".
4. Compartir: botón "Compartir" con native share API fallback a copiar URL.
5. SEO:
   - `<title>` = `[business_name] · [category] en [region] · Jurnex`.
   - `<meta description>` con tagline o bio primeros 150 chars.
   - Open Graph con foto destacada.
   - Schema.org JSON-LD `LocalBusiness` con name, description, address (region), image, url.
6. Link "← Volver al marketplace" preserva filtros previos.

## Edge cases

- Provider sin fotos (edge; M02 fuerza ≥1): placeholder gradient.
- Provider sin servicios activos: sección "Servicios" oculta, CTA contacto destacado.
- Slug cambió (renombrado raro): 301 redirect al nuevo si mantenemos mapping (post-MVP).
- Usuario no logueado intenta "Agregar a mi evento": prompt login → redirect back.
- Provider premium con portfolio enorme: paginar galería o limitar a 24 fotos visibles con "Ver todas".

## Out of scope

- Bookings/reservas (M10).
- Reviews (M14).
- Chat in-app (M11).
- Calendario de disponibilidad (M09).

## Dependencies

- M01 schema + media bucket.
- M04 listing (para navegación desde grid).
- M06 contacto (CTA primario necesita el modal de M06; si M06 aún no listo, MVP usa WhatsApp direct link).
