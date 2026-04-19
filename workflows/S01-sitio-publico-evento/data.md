# S01 — Data / Analytics

## Eventos (analytics)

| Evento | Disparo | Props (sin PII) |
|--------|---------|-----------------|
| `evento_sitio_config_viewed` | Entra a configuración sitio | `evento_id` hash o omitir; preferir enum `source: panel` |
| `evento_sitio_enabled` | Activa toggle | `activo: boolean` |
| `evento_sitio_slug_changed` | Guarda slug nuevo | no slug en claro si se considera semi-público; usar `slug_length` + `had_collision: boolean` |
| `evento_sitio_public_page_view` | Vista `/evento/[slug]` | `entrada: direct|panel_preview`; sin nombre de novios en props |

## Calidad

- No enviar emails ni teléfonos en `trackEvent`.
- Si se usa `evento_id` en servidor, hashear o usar categoría solo en entornos que lo permitan.

## Métricas producto (dashboard interno)

- % eventos paid con sitio activo.
- Ratio vistas públicas / invitaciones con token (definir ventana).
