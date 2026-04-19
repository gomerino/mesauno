# Tech — B02

**Resultados cerrados de spikes S1–S3:** ver `spike-resultados.md` (fuente de verdad post–abr 2026).

## Inventario código relevante

- Bulk correo: `src/lib/send-invitations-bulk.ts`, acciones en `src/app/panel/invitaciones-actions.ts`.
- WhatsApp 1:1: `src/components/dashboard/WhatsAppInviteButton.tsx`.
- Spotify: `src/lib/spotify-credentials.ts`, `src/app/panel/actions/spotify.ts`, `src/app/api/spotify/*`, tablas `evento_spotify`, `playlist_aportes`.
- Preview panel: `/panel/invitados/vista` (no confundir con invitación pública).
- Cards home: `src/components/panel/JourneyViajeClient.tsx`, orden `src/lib/journey-card-order.ts` (B01).

## Fotos ↔ programa

`evento_fotos` hoy solo tiene `created_at` (no EXIF en DB). Hitos en `evento_programa_hitos` con `hora` tipo `time`.

Recomendación v0 en `spike-resultados.md`: ventanas por `created_at` + TZ del evento; EXIF y `hito_id` manual como extensiones.

## Spotify: sugerencias / “votos”

Ya existe **`playlist_aportes`** (un registro por aporte de invitado). Búsqueda vía **Client Credentials**; escritura playlist vía refresh token del novio.

Para ranking “más pedidas”: agregar agregación por `track_uri` sobre `playlist_aportes` (sin nueva tabla obligatoria).

## WhatsApp masivo

No implementado en repo. Ver decisión de copy y roadmap en `spike-resultados.md` (S3).
