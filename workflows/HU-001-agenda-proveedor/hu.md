# HU-001 — Provider agenda & availability

## User story

**As a** provider (vendor)  
**I want to** define my availability and manage a calendar for my services  
**So that** couples can book real slots without manual back-and-forth.

## Acceptance criteria

1. Provider can access an "Agenda" or "Availability" section from the provider context (or MVP equivalent).
2. Provider can create **availability rules** or **time slots** (daily/weekly pattern and/or specific dates — MVP scope defined in `tech.md`).
3. System persists availability in PostgreSQL and exposes it to the couple-facing flow (read-only for couples in MVP if needed).
4. Couples can **check availability** for a service before completing a booking (align with product: anonymous vs authenticated).
5. Unavailable slots cannot be selected for a new booking (server-side validation).
6. Clear error when concurrent update conflicts (e.g. slot just taken).

## Edge cases

- Provider marks day off / holiday after slots were shown — stale UI; server must reject invalid booking.
- Multiple services under one provider with different durations — slot length and buffers (if any) defined in tech.
- Timezone: store in UTC; display in user/provider locale.

## Out of scope (for HU-001)

- Full payment capture (see roadmap).
- Recurring external calendar sync (Google Calendar) unless explicitly added later.

## Dependencies

- `Provider`, `Service`, `Availability` entities (`docs/architecture.md`).
- Auth: who can edit availability (provider role).
