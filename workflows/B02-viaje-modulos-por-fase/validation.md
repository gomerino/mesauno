# Validación — B02

## Problema

Las tarjetas del panel no reflejan el trabajo real por **tiempo del viaje** (invitaciones y canales en preparativos; programa + Spotify en despegue; día-D unificado en vuelo).

## Criterios de éxito (cualitativos)

- La pareja identifica **qué hacer ahora** sin mapa mental de rutas internas.
- “Invitaciones” en check-in agrupa acciones sin prometer capacidades que el backend no tiene (ej. WhatsApp API masiva).
- Despegue deja claro el **estado Spotify** y próximo paso técnico.
- En vuelo: una superficie principal (programa) como ancla; decisiones sobre chat/reacciones documentadas.

## Checklist pre-build

- [ ] PM firma orden de HUs.
- [ ] Tech firma spike Spotify + modelo fotos.
- [ ] UX firma wireframe en vuelo.
- [ ] QA firma plan de regresión bulk + OAuth.

## Rollout

Feature flags opcionales por fase; medir `panel_mission_order` y nuevos eventos data antes/después.
