# S01 — Validation

## Problema

Las parejas comparten información por WhatsApp/Instagram; hoy la invitación individual (`/invitacion/[token]`) no cubre el caso "página única del evento" para difusión amplia.

## Éxito (MVP)

- ≥1 uso real en beta con sitio activo > 7 días.
- Cero incidentes de fuga de datos PII en vista pública (revisión QA Q5–Q6).

## Checklist pre-release

- [ ] Migración aplicada en staging.
- [ ] RLS / función pública auditada.
- [ ] `noindex` decidido (sí/no) en meta de `/evento/[slug]`.
- [ ] Documentar en README interno diferencia vs `/invitacion`.

## Rollout

1. Staging + equipo interno.
2. Beta parejas (flag o plan Experiencia si aplica).
3. GA con monitorización de errores 48h.

## Linear

Crear issue épica **JUR** (o equipo acordado) con título sugerido: **Sitio público del evento (S01)** y enlazar esta carpeta `workflows/S01-sitio-publico-evento/`.
