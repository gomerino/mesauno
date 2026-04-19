# Analytics — M05 Provider detail page

## Events

| Event | When | Properties |
|---|---|---|
| `provider_viewed` | Page load | `provider_id`, `source: marketplace|direct|share`, `position_in_list` (si viene de M04) |
| `provider_portfolio_opened` | Click en foto portfolio | `provider_id`, `media_id` |
| `provider_portfolio_swiped` | Swipe en lightbox | `provider_id`, `direction`, `count` |
| `provider_contact_cta_clicked` | Click "Solicitar contacto" | `provider_id`, `source: hero|sticky|footer` |
| `provider_whatsapp_clicked` | Click WA chip | `provider_id` |
| `provider_email_clicked` | Click email chip | `provider_id` |
| `provider_social_clicked` | Click IG/web | `provider_id`, `network` |
| `provider_wishlist_added` | Click corazón | `provider_id`, `evento_id` |
| `provider_wishlist_removed` | Toggle off | `provider_id`, `evento_id` |
| `provider_shared` | Click share success | `provider_id`, `method: native|clipboard` |
| `provider_scroll_depth` | Scroll milestones | `provider_id`, `depth: 25|50|75|100` |

## Metrics

- **Engagement score:** composite de portfolio_opened + scroll_depth_75 + contact_cta_clicked.
- **Wishlist rate:** wishlist_added / provider_viewed.
- **Contact conversion:** contact_cta_clicked / provider_viewed (target ≥ 8%).
- **Portfolio depth:** avg fotos vistas por usuario.

## Dashboards

- Embudo `marketplace_viewed → card_clicked → provider_viewed → contact_cta_clicked → lead_submitted`.
- Top providers por contact conversion.
- Top providers por wishlist.
