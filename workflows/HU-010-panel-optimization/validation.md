# Validation — HU-010

## Problem

Users feel lost on `/panel` and do not see a clear path to “invitation ready”.

## Success criteria

- [ ] Stakeholder review: copy is non-technical and aligned with brand.
- [ ] Users can state **next action** after 5 seconds on the page (light usability test / internal dogfood).
- [ ] Progress matches documented rules in `tech.md` for 3 fixture accounts (no event / partial / complete).

## Pre-release checklist

1. **PM:** `hu.md` acceptance criteria satisfied.
2. **UX:** Mobile screenshot pass for new blocks.
3. **Tech:** No new secrets; progress logic unit-testable or manually verified.
4. **QA:** `qa.md` executed; no regressions on invitados/metrics.
5. **Data:** Events fire in staging (`data.md`).

## Rollout

- Ship behind no flag if low risk; otherwise short internal beta.
