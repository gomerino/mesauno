# Validation — HU-001

## Problem

Couples need trustworthy slots; providers need a single place to manage supply.

## Success criteria (product)

- [ ] Couples can retrieve availability without inconsistent states vs bookings.
- [ ] Providers can update availability without developer intervention.

## Validation checklist

1. **PM:** Acceptance criteria in `hu.md` signed off.
2. **UX:** Flows reviewed on mobile viewport; error states defined.
3. **Tech:** API + schema reviewed (`tech.md`); no duplicate booking under concurrency test plan.
4. **QA:** Test plan executed; blockers resolved (`qa.md`).
5. **Data:** Events `availability_checked` and `booking_*` verified in staging.

## Rollout

- Feature flag or provider pilot cohort if risk warrants.
