# S01 — QA

## Casos

| ID | Caso | Esperado |
|----|------|----------|
| Q1 | Slug duplicado al guardar | Error claro o auto-sufijo; nunca 500 silencioso |
| Q2 | Sitio desactivado | GET público 404 |
| Q3 | Usuario no miembro intenta PATCH | 403 |
| Q4 | Editor sin permiso cambia slug | 403 si política = solo admin |
| Q5 | Anon GET con slug válido y activo | 200 + solo campos públicos en HTML |
| Q6 | IDOR: otro `evento_id` en API | No filtrar por id expuesto en URL pública; usar solo slug |

## Seguridad

- No reflejar `payment_id`, emails de miembros, tokens de invitado en la página pública.
- Probar con curl/HTML que no aparezcan comentarios con datos internos.

## No funcional

- LCP razonable en 4G (imágenes opcionales lazy).

## Sign-off

- [ ] Criterios `hu.md` cubiertos o tickets hijos creados.
- [ ] Copy revisado (sin voseo argentino).
