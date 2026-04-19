# Data — B02

## Eventos sugeridos (sin PII)

| Evento | Props |
|--------|--------|
| `panel_phase_clicked` | `phase_id` (enum fase) |
| `invitaciones_bulk_started` | `evento_id` (UUID), `count` (bucket) |
| `invitaciones_bulk_completed` | `evento_id`, `sent`, `failed` (buckets) |
| `spotify_connect_clicked` | `evento_id` |
| `spotify_track_suggested` | `evento_id`, `track_id` (Spotify id) |
| `programa_hito_photo_associated` | `evento_id`, `hito_id`, `rule` (`subida` \| `exif` \| `manual`) |

No emails, nombres ni teléfonos en props.

## KPIs de producto (indirectos)

- Tiempo hasta “invitación enviada” (funnel agregado).
- Uso de bulk vs envío individual.
- Conexión Spotify completada / tracks en playlist.
