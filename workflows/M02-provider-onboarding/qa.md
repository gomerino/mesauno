# QA plan — M02 Provider onboarding

## Cases

| ID | Case | Steps | Expected |
|---|---|---|---|
| Q1 | Happy path | Landing → registro 3 pasos → confirm | Row provider pending creado, email sent, redirect confirm |
| Q2 | Email existente (novio) | Registrarse con email ya user | Login ok, provider nuevo creado, sin duplicar user |
| Q3 | Draft persistente | Paso 2 → cerrar tab → volver | Form prefill con datos previos |
| Q4 | Draft TTL | Paso 2 → volver > 7 días | Draft vacío |
| Q5 | Upload >10MB | Subir foto 12MB | Error inline, no upload |
| Q6 | Upload mime inválido | Subir PDF | Error inline |
| Q7 | Slug colisión | Dos providers "Studio Luz" | Segundo recibe `studio-luz-2` |
| Q8 | Admin approve | Admin click approve | Status → approved, email sent |
| Q9 | Admin suspend con reason | Click suspend, dropdown reason | Status → suspended, reason guardado, email sent |
| Q10 | No admin hits admin route | User normal GET /api/admin/providers | 403 |
| Q11 | Mobile stepper | iPhone 12, registrarse completo | Sin scroll horizontal, CTA siempre visible |
| Q12 | A11y | keyboard-only navegación | Todos los campos focuseable, errores announced |
| Q13 | Provider pending ve `/provider` | Login y navegar | Banner pending + preview editable |
| Q14 | Provider pending NO aparece en marketplace | GET /marketplace público | Rows pending no listados |

## Non-functional

- Landing Lighthouse Performance ≥ 90.
- Upload foto 5MB en conexión 4G simulada < 15s.

## Security

- IDOR: user A no puede PATCH provider B.
- Upload storage path: validar que UUID de path coincide con provider_id del user.
- Email HTML: sanitizar variables para evitar injection.

## Sign-off

- [ ] Q1–Q14 passed.
- [ ] 3 providers reales cargados en staging.
- [ ] Admin review workflow probado con un real.
- [ ] Emails llegan en staging.
