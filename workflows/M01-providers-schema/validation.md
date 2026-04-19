# Validation — M01 Providers schema

## Problem

Hoy `marketplace_servicios` es una tabla plana de mock data con `proveedor` como texto libre. No permite onboarding, contacto real, ni ningún flujo transaccional.

## Success criteria (product)

- [ ] Proveedor real puede ser creado vía API desde backend (aunque sea con curl/seed script).
- [ ] Novio puede ver solo proveedores approved desde cliente público.
- [ ] Lead puede ser insertado desde user autenticado y leído por el provider dueño.
- [ ] Wishlist idempotente: mismo input 2 veces no duplica.

## Validation checklist

1. **PM:** AC de `hu.md` firmados.
2. **Tech Lead:** schema + RLS revisados; migración forward+rollback validados.
3. **Dev:** tipos TS + helpers en `src/lib/providers/` exportados y compilan.
4. **QA:** Q1–Q14 passed.
5. **Data:** eventos `provider_registered`, `provider_approved`, `provider_suspended` verificados en pipeline (aunque sea como log).

## Rollout

- Feature flag `NEXT_PUBLIC_MARKETPLACE_V1=false` hasta que M04+M05 estén listos.
- Habilitar en staging con seed de 5 proveedores dummy.
- Producción solo tras M06 (contacto) listo.
