# Analytics — M06 Lead contact flow

## Events

| Event | When | Properties |
|---|---|---|
| `lead_modal_opened` | Click CTA primario en M05 | `provider_id`, `source: hero|sticky|footer` |
| `lead_auth_required_shown` | Modal abre mini auth | `provider_id` |
| `lead_auth_completed_inline` | User auth desde modal | `provider_id`, `method: email|magic` |
| `lead_form_abandoned` | Cierra modal sin submit | `provider_id`, `time_in_modal_ms` |
| `lead_submitted` | Submit OK | `lead_id`, `provider_id`, `channel`, `has_budget`, `has_evento_context`, `plan_capped` |
| `lead_submit_error` | Submit fail | `provider_id`, `error_code` |
| `lead_whatsapp_opened_post_submit` | Click "Abrir WA" en confirm | `provider_id` |
| `lead_similar_providers_clicked` | Click "ver similares" | `provider_id`, `category`, `region` |
| `lead_email_bounced_provider` | Email bounce log | `lead_id`, `provider_id` |

## Metrics

- **Lead submit rate:** `lead_submitted / lead_modal_opened`.
- **Modal abandon rate:** `lead_form_abandoned / lead_modal_opened`.
- **Auth friction:** `lead_auth_required_shown → lead_auth_completed_inline` conversion.
- **Post-submit engagement:** `whatsapp_opened_post_submit / lead_submitted`.
- **Capped rate:** `plan_capped=true / total leads` (guardrail supply premium adoption).

## Provider-side metrics (via provider_leads tabla)

- **Leads per provider per month.**
- **Channel distribution** (whatsapp vs email).
- **Time to first response** (post-MVP, requires response tracking en M11).

## Dashboards

- Funnel novio: `provider_viewed → modal_opened → submitted → whatsapp_opened`.
- Funnel provider: `lead_created → email_delivered → [response]` (respuesta solo in M11).
- Segmentación por plan Free vs Premium (capped rate).
