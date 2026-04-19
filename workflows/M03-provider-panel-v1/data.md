# Analytics — M03 Provider panel

## Events

| Event | When | Properties |
|---|---|---|
| `provider_panel_viewed` | GET `/provider` | `provider_id`, `section` |
| `provider_profile_updated` | PATCH success | `provider_id`, `fields_changed: string[]` |
| `provider_service_created` | POST service | `provider_id`, `category`, `price_from_clp` |
| `provider_service_updated` | PATCH service | `provider_id`, `service_id`, `fields_changed` |
| `provider_service_deleted` | DELETE | `provider_id`, `service_id` |
| `provider_media_reordered` | POST reorder | `provider_id`, `count` |
| `provider_plan_upgrade_cta_clicked` | Click "Cambiar a Premium" | `provider_id`, `source: home|plan|cap` |
| `provider_lead_opened` | Click detail de lead | `provider_id`, `lead_id`, `channel` |
| `provider_lead_channel_clicked` | Click "Abrir WhatsApp" / "Responder email" | `provider_id`, `lead_id`, `channel` |

## Metrics

- **Activación D1/D7/D30:** provider approved → primer update de perfil / servicio / media.
- **Completeness score:** % de campos llenos (bio, >= 3 fotos, >= 1 servicio con precio, social links).
- **Lead response rate proxy:** `lead_channel_clicked / lead_opened` (no medimos responder real en MVP).
- **Upgrade intent:** clicks CTA upgrade / MAU providers.

## Dashboard provider-facing (futuro)

- Mostrar al provider sus propios KPIs: views, leads, conv, ranking en su categoría.
- No exponer comparativas absolutas (puede desmotivar); solo percentiles ("estás en top 30% de fotógrafos en RM").
