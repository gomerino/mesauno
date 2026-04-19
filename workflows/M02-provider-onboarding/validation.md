# Validation — M02 Provider onboarding

## Problem

Los proveedores no tienen forma de entrar al marketplace sin intervención manual del equipo. Eso limita el supply a cuánto podemos cargar nosotros (no escala).

## Success criteria (product)

- [ ] Un proveedor puede registrarse solo en < 10 min.
- [ ] Admin puede aprobar en < 2 min por provider.
- [ ] SLA de aprobación p95 ≤ 48h.
- [ ] Tasa abandono en registro ≤ 50%.

## Validation checklist

1. **PM:** AC firmados, copy revisado y warm.
2. **UX:** Flow validado en mobile (iPhone 12, Pixel 5), sin scroll innecesario.
3. **Tech:** Endpoints + transaccionalidad validados; draft + cleanup storage probados.
4. **QA:** Q1–Q14 passed.
5. **Data:** Eventos completos en staging; funnel dashboard visible.
6. **Growth:** Copy de landing decidido (A/B pospuesto a post-launch).

## Rollout

1. Feature flag `PROVIDER_REGISTRATION_OPEN=false` hasta sign-off.
2. Beta cerrada: 5 proveedores por invitación.
3. Beta abierta: landing público pero con banner "Beta" por 2 semanas.
4. Production: quitar flag y banner.
