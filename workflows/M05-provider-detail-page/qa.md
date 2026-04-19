# QA plan — M05 Provider detail page

## Cases

| ID | Case | Steps | Expected |
|---|---|---|---|
| Q1 | Happy path | Click card desde M04 | Detalle cargado correctamente |
| Q2 | 404 slug inválido | GET /marketplace/nope | 404 amigable |
| Q3 | 404 provider pending | Slug de pending | 404 |
| Q4 | Suspended oculto | Slug suspended | 404 |
| Q5 | Portfolio lightbox | Click foto | Lightbox abre, swipe funciona |
| Q6 | Esc cierra lightbox | Keyboard Esc | Cierra, focus vuelve al trigger |
| Q7 | Share native | Mobile click share | navigator.share invocado |
| Q8 | Share fallback | Desktop click share | Clipboard + toast |
| Q9 | Wishlist sin auth | Click corazón sin login | Redirect a login con next |
| Q10 | Wishlist con auth | Click corazón con auth | POST success, UI optimistic |
| Q11 | CTA sticky mobile | Scroll mobile | Aparece tras hero fuera de viewport |
| Q12 | SEO metadata | View source | Title + description correctos |
| Q13 | JSON-LD valid | Correr Schema Validator | Sin errores |
| Q14 | Servicios vacíos | Provider sin servicios | Sección oculta |
| Q15 | Bio vacía | Provider sin bio | Fallback copy |
| Q16 | LCP hero | Lighthouse mobile | LCP < 2.5s |
| Q17 | Back preserva filtros | Detalle ← Volver | Vuelve a listing con filtros previos |

## Non-functional

- Lighthouse Performance ≥ 85 mobile.
- Bundle page < 180kb gzipped (incluye lightbox).
- CLS < 0.1.

## Security

- Slug nunca inyecta HTML (escape explícito).
- JSON-LD sanitizado (si provider pone HTML en bio, escapar).
- Lightbox no expone URLs internas.

## Sign-off

- [ ] Q1–Q17 passed.
- [ ] 5 providers diversos testeados (con/sin fotos, con/sin servicios).
