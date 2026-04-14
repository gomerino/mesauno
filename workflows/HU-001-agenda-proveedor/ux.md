# UX notes — HU-001 Provider agenda

## Couple flow (read path)

1. Marketplace → provider profile → service detail.
2. **Availability widget:** pick date (and time if applicable) → see only open slots.
3. CTA "Reservar" / "Continuar" → login or checkout per product rules.

## Provider flow (write path)

1. Dashboard entry: "Disponibilidad" / "Agenda".
2. Set weekly hours + exceptions (days off).
3. Optional: per-service duration preview so provider understands slot consumption.
4. Save → confirmation toast; invalid ranges inline.

## Friction reduction

- Mobile-first: large tap targets for calendar; avoid dense tables on small screens.
- Show **next available** slot as a shortcut on service detail.

## Open questions for PM

- Can guests see availability without account? (impacts conversion vs spam)
- Minimum booking lead time (e.g. 48h) — product rule.
