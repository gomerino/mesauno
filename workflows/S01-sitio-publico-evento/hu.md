# S01 — Sitio público del evento (micrositio novios)

## User story

**As a** pareja que organiza su matrimonio en Jurnex  
**I want** una **URL pública** que represente nuestro evento (nombre, fecha, detalles que elijamos mostrar)  
**So that** podemos compartir un solo enlace con familia y amigos (además de la invitación individual `/invitacion/[token]`).

## Acceptance criteria

1. **URL en el mismo dominio del producto (MVP):** ruta pública estable, por ejemplo `/evento/[sitio_slug]`, donde `sitio_slug` es único global y lo gestionan solo miembros admin del evento.
2. **Panel:** en configuración del evento (o sección dedicada), la pareja puede:
   - Activar o desactivar la visibilidad del sitio público.
   - Definir o regenerar el `sitio_slug` (validación formato kebab-case, único).
   - Ver y copiar el enlace canónico.
3. **Contenido público mínimo (v1):** mostrar al menos nombre del evento / nombres de la pareja, fecha(s) relevantes y destino/lugar si existen en `eventos`; sin exponer datos sensibles (emails, IDs internos, tokens).
4. **Seguridad:** lectura pública solo si el evento tiene “sitio público activo”; RLS o políticas equivalentes; no listar eventos en un directorio público en v1 (solo quien tenga el enlace).
5. **Coexistencia con invitación:** el sitio público **no reemplaza** `/invitacion/*`; son propósitos distintos (difusión general vs invitado con token). Referencias cruzadas opcionales en texto, sin duplicar lógica de invitación.
6. **Mobile-first:** la página pública se lee bien en móvil y respeta tokens visuales del producto (o tema del evento si ya existe vínculo con `theme_id` en alcance acordado).

## Edge cases

- Slug colisiona: el sistema sugiere sufijo `-2` o similar antes de guardar.
- Evento sin plan pagado: definir si el sitio público es solo plan Experiencia / paid (decisión producto; documentar en `validation.md`).
- Staff `staff_centro`: no puede cambiar slug si la política del panel lo restringe a admin.

## Out of scope (v1)

- Dominio propio por pareja (CNAME) y subdominios wildcard (`*.jurnex.cl`) — ver `tech.md` como fase 2.
- Editor visual de páginas (bloques drag-and-drop).
- Blog, RSVP o formularios en el sitio público (pueden ser HUs aparte).
- SEO agresivo (sitemap masivo de eventos); en v1 `noindex` opcional hasta definir política.

## Dependencies

- Modelo `eventos` + membresía (`evento_miembros`) existentes.
- Alineación con branding B01 si el sitio debe heredar paleta/tipografía.
- RPC o datos ya usados en B02 (programa + fotos públicas) solo si el scope de S01-v2 incluye “mostrar programa en el sitio”.
