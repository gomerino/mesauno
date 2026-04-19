# QA plan — M01 Providers schema

## Scope

Migración DDL, RLS policies, storage bucket, tipos TS, helpers.

## Cases

| ID | Case | Steps | Expected |
|---|---|---|---|
| Q1 | Migración forward | Correr migration en staging vacía | Todas las tablas creadas, sin error |
| Q2 | Rollback | Correr rollback documentado | Todo vuelve al estado previo, sin residuos |
| Q3 | RLS provider public read | SELECT anónimo sobre providers | Solo devuelve rows con status='approved' |
| Q4 | RLS provider owner write | Update desde user_id propio | Éxito |
| Q5 | RLS provider stranger write | Update desde user_id ajeno | Rechazo (empty result) |
| Q6 | RLS provider_services bloqueado | Anónimo pide services de provider 'pending' | Empty result |
| Q7 | Lead duplicado mismo día | Crear 2 leads mismo provider/sender/channel/día | Segundo rechaza por UNIQUE |
| Q8 | Lead duplicado día distinto | Crear 2 leads con `day_bucket` distinto | Ambos éxito |
| Q9 | Wishlist duplicado | Add mismo (evento, provider, service) 2 veces | Segundo rechaza por UNIQUE |
| Q10 | Cascade delete user | DELETE auth.users row | providers/services/media/leads del user se eliminan |
| Q11 | Storage bucket read | GET objeto del bucket sin auth | Éxito (bucket público) |
| Q12 | Storage bucket write auth | POST objeto autenticado | Éxito |
| Q13 | Storage bucket write anon | POST objeto sin auth | 403 |
| Q14 | TS types compilan | `tsc --noEmit` | Sin errores |

## Non-functional

- `EXPLAIN ANALYZE` en `listApprovedProviders({ category, region })` < 50ms con 1000 rows (usar índices).
- Tamaño migration script < 500 líneas (legibilidad).

## Security

- Intento IDOR: provider A lee leads de provider B → denegado (Q en 429 ya cubre).
- Intento inyección SQL vía slug: sanitizar en app layer, DB debe resistir igualmente.

## Sign-off

- [ ] Migration aplicada en staging sin errores.
- [ ] Todas las Q1–Q14 passed.
- [ ] Dev docs en `tech.md` alineadas con schema real.
- [ ] Rollback validado.
