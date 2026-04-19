# Validation — M04 Marketplace listing

## Problem

El marketplace actual (`marketplace_servicios` flat + UI plana) no transmite la calidad del producto ni permite descubrimiento eficiente. Novios rebotan o no descubren proveedores relevantes.

## Success criteria

- [ ] Novio llega a `/marketplace` y puede filtrar en < 30s sin instrucciones.
- [ ] CTR de card (view → click) ≥ 15%.
- [ ] Rebote < 40% en `/marketplace`.
- [ ] Regresión: 0 bugs en /panel o /invitacion.

## Validation checklist

1. **PM:** AC firmados.
2. **UX:** Mockups finales revisados; copy warm; responsive validado.
3. **Tech:** Query performance validada con 100+ providers seed.
4. **QA:** Q1–Q15 passed.
5. **Data:** Eventos + dashboards listos.
6. **Growth:** SEO metadata validada con `next build` + Lighthouse.

## Rollout

- Feature flag `MARKETPLACE_V1=false` en producción.
- Beta cerrada: link directo staff/beta novios.
- Habilitar público tras M05 + M06 listos.
