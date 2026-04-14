# Analytics — HU-001

## Events

| Event name | When | Properties |
|------------|------|------------|
| `availability_checked` | User loads or changes date/range on availability UI | `provider_id`, `service_id`, `from`, `to`, `source` |
| `provider_viewed` | Provider or service detail view | `provider_id`, `service_id` (optional) |
| `booking_started` | User commits to a slot and starts booking | `provider_id`, `service_id`, `slot_start` |
| `booking_completed` | Booking reaches success state | `booking_id`, `provider_id`, `service_id` |

## Metrics

- **Availability engagement:** `availability_checked` / `provider_viewed`.
- **Booking conversion:** `booking_completed` / `booking_started`.

## Notes

- Debounce `availability_checked` if range changes fire excessive events.
- Avoid PII in properties; use internal UUIDs.
