# Growth — HU-001 Agenda proveedor

## Funnel touchpoints

- `availability_checked` should fire when the couple opens the calendar or changes date range (debounced if needed).
- After HU-001, enable **transparent urgency** on slot lists: "3 slots left this week" only if backed by real availability counts.

## Hypotheses

| ID | Hypothesis | Metric |
|----|------------|--------|
| H1 | Showing next available slot on listing cards increases `provider_viewed` → `booking_started` | Conversion rate |
| H2 | Checking availability pre-login increases sessions that reach `booking_started` | Funnel drop-off before auth |

## Tactics (ethical)

- Recommendations: "Popular in your area" with clear criteria (reviews + availability).
- Ranking: boost providers with **upcoming availability** to improve booking velocity.

## Guardrails

- No fake scarcity; copy must match `Availability` data.
