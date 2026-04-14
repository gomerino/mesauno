# UX notes — HU-010 Panel

## Primary user flow

1. Land on `/panel` after login.
2. See **hero + progress** at a glance: “where you are” in one screen.
3. **Próximos pasos**: tap one row → deep link to `/panel/evento`, `/panel/invitados`, or share flow (`/panel/vista-invitacion` / copy link — align with existing IA).
4. Return to panel to see updated progress.

## Information architecture

- **Order of attention:** (1) progress + next step, (2) event summary if exists, (3) metrics cards, (4) secondary links.
- **Tone:** warm, short sentences; avoid jargon; celebrate small wins (“Listo: ya tienes tu evento”).

## Friction reduction

- One primary CTA per block: “Completar datos”, “Agregar invitados”, “Copiar enlace” / “Ver invitación”.
- Checklist: show **done** vs **todo** with checkmarks; optional “skipped” only if product allows.

## Empty states

| State | Message direction | CTA |
|-------|-------------------|-----|
| No evento | “Tu fiesta empieza con los datos básicos” | Configurar evento |
| Evento sin invitados | “Aún no hay invitados — añade a quien quieras celebrar” | Ir a invitados |
| Evento listo para compartir | Reinforce share + optional metrics | Ver / copiar invitación |

## Mobile-first

- Progress bar full width; touch targets ≥ 44px for checklist rows.
- Avoid walls of text; use 2–3 lines max per block intro.
