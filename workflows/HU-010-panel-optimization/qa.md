# QA plan — HU-010

## Scope

`/panel` layout, copy, checklist, progress bar, empty states. Regression: links to `/panel/evento`, `/panel/invitados`, invitation flow.

## Test cases

| ID | Case | Steps | Expected |
|----|------|-------|----------|
| T1 | No evento | Account sin `evento` | Empty state + CTA a crear evento; progress 0% or equivalent; no technical terms |
| T2 | Evento sin invitados | Evento mínimo válido | Checklist: event done; guests pending; progress no al 100% |
| T3 | Con invitados | ≥1 invitado | Guests step advances per rules |
| T4 | Share heuristic | Meet “share done” condition | Last step complete; progress 100% if rules say so |
| T5 | Mobile | 375px width | No overflow; readable; CTAs tappable |
| T6 | Regression | Open métricas cards | InvitacionMetricasCard still works |

## Non-functional

- No console errors; no hydration mismatch if introducing client subcomponents.

## Sign-off

- [ ] Blockers: **none**  
- [ ] Ready to merge: **yes/no**  
