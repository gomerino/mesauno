# QA plan — M06 Lead contact flow

## Cases

| ID | Case | Steps | Expected |
|---|---|---|---|
| Q1 | Happy path WA | Auth user, submit con canal WA | Lead creado, emails enviados, CTA "Abrir WA" funciona |
| Q2 | Happy path email | Submit canal email | Lead creado, CTA "Abrir email" funciona |
| Q3 | No auth → auth inline | Click CTA sin login | Mini auth; tras success, modal pre-fill |
| Q4 | Duplicado mismo día | Submit 2x mismo provider/canal | Segundo 409, UI warm "Ya enviaste hoy" |
| Q5 | Diferente canal mismo día | Submit WA luego email | Ambos OK |
| Q6 | Rate limit global 5/day | Submit 6 leads distintos mismo día | Sexto 429 |
| Q7 | Provider suspended | Provider cambia a suspended entre view y submit | 409 con mensaje warn |
| Q8 | Plan cap free | Provider free con 3 leads mes | Lead creado `plan_capped=true`, provider NO recibe email, novio ve mensaje "alto volumen + similares" |
| Q9 | Contador bump | Después de insert | `providers.leads_this_month` incrementado |
| Q10 | Reset mensual | Correr job | Contadores → 0 |
| Q11 | WhatsApp link | Click en confirm | `wa.me/+56...?text=...` correcto |
| Q12 | Mobile full-screen | iPhone 12 | Modal ocupa viewport completo |
| Q13 | Keyboard no rompe UI | Tap textarea en mobile | No saltos, CTA visible |
| Q14 | Presupuesto opcional | Submit sin presupuesto | OK |
| Q15 | Mensaje < 20 chars | Submit | Validation inline, no submit |
| Q16 | IDOR: lead de otro | User A crea lead con evento_id de B | Validar que evento_id pertenece a user A |
| Q17 | A11y | Keyboard only | Modal navigable, focus trap correcto |

## Non-functional

- Latencia submit p95 < 500ms (sin contar emails).
- Emails se encolan no bloquean response.

## Security

- No exponer email del novio al provider en email.
- No exponer teléfono del novio si canal = email.
- Sanitizar mensaje (el provider verá lo que escribió el novio — XSS prevención en email HTML).

## Sign-off

- [ ] Q1–Q17 passed.
- [ ] Emails probados en staging con direcciones reales.
- [ ] Contador reconciliation job documentado.
