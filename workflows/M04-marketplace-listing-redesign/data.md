# Analytics — M04 Marketplace listing

## Events

| Event | When | Properties |
|---|---|---|
| `marketplace_viewed` | GET `/marketplace` | `filters: object`, `results_count: int`, `logged_in: bool` |
| `marketplace_filter_applied` | Change en cualquier filtro | `filter_name`, `filter_value`, `previous_value` |
| `marketplace_card_clicked` | Click en card | `provider_id`, `position: int`, `plan`, `filters_active: object` |
| `marketplace_empty_shown` | Render con 0 resultados | `filters: object` |
| `marketplace_load_more_clicked` | Click "Cargar más" | `page: int` |
| `provider_viewed` | Landing en `/marketplace/[slug]` (M05) | `provider_id` — usado en funnel |

## Metrics

- **Discovery funnel:** `marketplace_viewed → card_clicked → provider_viewed → lead_submitted`.
- **CTR por posición:** desagregado por position 1–24.
- **Filter engagement:** % usuarios que aplican al menos 1 filtro.
- **Most-used filters:** frecuencia por `filter_name` + `filter_value`.
- **Empty state rate:** `empty_shown / viewed`. Si > 15% → problema supply.

## Segmentación

- Por `logged_in` (novios registrados vs anónimos).
- Por primary_category visualizada más.
- Por región (match con región del novio si tenemos `evento.region`).

## Privacy

- No capturar IP o geo detallada.
- Nota sobre dedupe: `session_id` para evitar contar 1 sesión como 50 views.
