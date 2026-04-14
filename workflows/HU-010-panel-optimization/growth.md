# Growth notes — HU-010 (handoff to HU-011)

HU-010 focuses on **structure, clarity, and progress**; emotive nudges and dynamic copy are **HU-011**.

## What HU-010 should enable for Growth

- A **single computed `setup_progress_pct`** (or discrete step index) reused later by HU-011 for:
  - “Ya estás a un paso de…”
  - CTA prioritization (“Completar evento” vs “Agregar invitados”).

## Hypotheses (measure after ship)

| ID | Hypothesis | Proxy metric |
|----|------------|----------------|
| G1 | Visible checklist increases visits to `/panel/evento` and `/panel/invitados` | Click-through from checklist |
| G2 | Progress bar reduces bounce from `/panel` without navigation | Time on page + next route |

## Guardrails

- Progress must not feel **punitive**; avoid shame copy for empty guest list at early stage.
- Do not fake completion: only mark “share” done when link viewed/copied rules are defined (product decision).

## Dependencies

- Event names for analytics: `panel_viewed`, `panel_checklist_click`, `panel_progress_bucket` (see `data.md`).
