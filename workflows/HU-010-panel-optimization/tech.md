# Technical spec — HU-010 Panel optimization

## Scope

- **Route:** `src/app/panel/page.tsx` (and small presentational components under `src/components/panel/` if needed).
- **No** new backend tables required for MVP if progress is derived from existing queries (`evento`, invitados, optional flags).

## Progress computation (suggested)

Define a pure function, e.g. `getPanelSetupProgress(evento, invitadosSummary) -> { pct: number; steps: Step[] }`:

| Step | Weight (example) | “Done” when |
|------|------------------|-------------|
| Event basics | 40% | `evento` exists and required fields filled (list fields explicitly: names, `fecha_boda`, etc.). |
| Guests | 35% | `totalInvitados >= 1` (or threshold aligned with PM). |
| Share | 25% | Invitation link shared heuristic: e.g. `invitacion_vista === true` OR `email_enviado > 0` — **confirm with product**. |

Adjust weights and rules in one module so **HU-011** can import the same helper.

## Copy / i18n

- Centralize new strings in small constants or a `panelCopy` object to avoid scattered literals.

## API

- None required for MVP; server component fetches data as today.

## Non-goals

- Persisting “user dismissed checklist” unless UX asks (localStorage optional later).

## Files (likely)

- `src/app/panel/page.tsx` — layout composition.
- `src/lib/panel-setup-progress.ts` (new) — pure progress + checklist model.
