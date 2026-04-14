# HU-010 — Panel optimization (`/panel`)

## User story

**As a** couple using the app  
**I want** a clear, guided panel that shows my progress  
**So that** I know what to do next and feel confident sharing my invitation.

## Acceptance criteria

1. No user-facing copy exposes **technical implementation names** (DB tables, vendor SDK names, infra). Navigation labels stay human (“Evento”, “Invitados”, not internal identifiers).
2. The panel shows a **“Próximos pasos”** (or equivalent) section with at least three steps: complete event details, add guests, share invitation — each with a clear CTA or link to the right route.
3. A **progress indicator** (e.g. percentage or stepped bar) reflects setup completion using **documented rules** (see `tech.md`); it updates when the underlying data changes.
4. **Empty states** are explicit when there is no event, no guests, or missing key data — each with short guidance and a primary CTA.
5. Layout remains **mobile-first**: readable typography, tap targets, no horizontal scroll on small viewports for the new blocks.
6. Existing panel metrics/cards (invitados, RSVP, regalos) remain functional; changes are additive or copy/layout unless a bug is fixed as part of QA.

## Edge cases

- User has event but zero guests → checklist shows “add guests” as next; empty state on invitados route still consistent with panel messaging.
- User partially completed event (e.g. names but no date) → progress reflects partial completion per rules (no misleading 100%).
- Multiple members on same event (if applicable) → progress is per evento, not per auth noise; no duplicate contradictory messages.

## Out of scope

- Full onboarding wizard (see HU-018).
- Dashboard `/dashboard/[evento_id]` changes (HU-012+).
- Growth copy variants and nudges (HU-011) — may consume same progress API later.

## Dependencies

- `evento` + invitados data already loaded or loadable on `PanelPage` (`src/app/panel/page.tsx`).
- Design tokens / components from existing panel layout.
