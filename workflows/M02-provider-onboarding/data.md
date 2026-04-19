# Analytics — M02 Provider onboarding

## Events (client + server)

| Event | When | Properties |
|---|---|---|
| `provider_landing_viewed` | GET `/para-proveedores` | `variant` (si A/B en futuro) |
| `provider_registration_started` | Click CTA landing → registro | — |
| `provider_registration_step_completed` | Submit paso 1, 2, 3 | `step: 1|2|3`, `duration_ms` |
| `provider_registration_completed` | Confirmación tras paso 3 | `provider_id`, `primary_category`, `region`, `media_count` |
| `provider_registration_abandoned` | Unload con draft no completado (beacon) | `last_step: 1|2|3` |
| `provider_media_uploaded` | Upload OK | `provider_id`, `kind`, `size_kb`, `is_first` |
| `provider_approved` | Admin click approve | `provider_id`, `time_to_approve_h`, `reviewer_email` |
| `provider_suspended` | Admin click suspend | `provider_id`, `reason_code` |

## Metrics

- **Conversion landing → start:** `registration_started / landing_viewed`.
- **Conversion start → complete:** `registration_completed / registration_started`.
- **Funnel por step:** drop-off de 1→2→3.
- **SLA aprobación:** p50 y p95 de `time_to_approve_h`.
- **Calidad input:** % providers con ≥ 3 fotos en registro.

## Guardrails

- `registration_abandoned` usa `navigator.sendBeacon` para no retener el unload.
- Eventos server (`approved`/`suspended`) van a la misma tabla de analytics que los client para dashboard unificado.
