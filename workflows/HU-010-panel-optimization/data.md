# Analytics — HU-010

## Events (suggested)

| Event name | When | Properties |
|------------|------|------------|
| `panel_viewed` | `/panel` load (once per session or per visit — team convention) | `setup_progress_pct`, `evento_id` if present |
| `panel_checklist_click` | User taps a checklist row CTA | `step_id` (`evento` \| `invitados` \| `compartir`), `target_path` |
| `panel_progress_bucket` | Optional snapshot | `bucket` (`0-25` \| `26-50` \| `51-75` \| `76-100`) |

## Metrics

- **Activation:** sessions with `panel_checklist_click` / `panel_viewed`.
- **Depth:** correlation between `setup_progress_pct` and `booking_started` / invitation metrics (if tracked elsewhere).

## Implementation notes

- Emit from client component only if needed; prefer server + one client event for clicks.
- Align property names with `docs/architecture.md` (snake_case in payloads if that is backend convention).

## Relation to HU-011

HU-011 may add `panel_nudge_viewed` / `panel_cta_click`; reuse `setup_progress_pct` from the same source.
