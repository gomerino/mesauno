# QA plan — M03 Provider panel v1

## Cases

| ID | Case | Steps | Expected |
|---|---|---|---|
| Q1 | Auth + ownership | Login provider A, abrir /provider | Ve su perfil |
| Q2 | No auth | GET /provider sin login | Redirect a /login |
| Q3 | User sin provider row | Login user que no es provider | Redirect a /para-proveedores |
| Q4 | Auto-save perfil | Editar tagline, blur | "Guardando…" → "Guardado ✓" |
| Q5 | Suspended no edita | Abrir perfil con status=suspended | Form readonly + banner rojo |
| Q6 | Cap fotos free | Subir 7ma foto | Modal upsell, upload bloqueado |
| Q7 | Premium sin cap | Provider premium subir 10ma | Éxito |
| Q8 | Crear servicio | Modal + submit | Row creada, lista actualizada |
| Q9 | Reorder servicios | Drag + drop | Nuevo sort_order persistido |
| Q10 | Delete servicio | Click eliminar, confirmar | is_active=false (soft delete) |
| Q11 | Lista leads | Abrir tab | Ordenados por fecha desc |
| Q12 | Filtro leads channel | Seleccionar "WhatsApp" | Solo whatsapp leads |
| Q13 | Click abrir WhatsApp | Click CTA | Abre `wa.me/...` con número del novio |
| Q14 | IDOR services | PATCH service de provider B | 403 |
| Q15 | Mobile tabs | iPhone 12, navegar las 5 tabs | Sin scroll horizontal |
| Q16 | Home KPIs | Provider con 0 leads | Muestra "0 leads todavía" friendly |

## Non-functional

- `/provider` home LCP < 2s en 4G simulado.
- Panel funciona offline en modo read-only (Service Worker opcional, post-MVP).

## Security

- Todo endpoint `/api/providers/me*` valida `auth.uid() === provider.user_id`.
- No exponer emails de otros providers en responses.
- CSRF: route handlers protegidos por Next App Router SameSite cookies.

## Sign-off

- [ ] Q1–Q16 passed.
- [ ] 2 providers reales de staging pueden editar perfil.
- [ ] Suspended flow probado con provider real.
