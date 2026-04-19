# QA plan — M04 Marketplace listing

## Cases

| ID | Case | Steps | Expected |
|---|---|---|---|
| Q1 | Listado inicial | GET /marketplace sin filtros | Cards visibles, approved only |
| Q2 | Filtro categoría | Click chip "Fotografía" | URL con `?categoria=fotografia`, solo fotografos |
| Q3 | Filtro combinado | Cat + región + precio | URL con 3 params, resultados intersección |
| Q4 | Clear filter | Click [x] en píldora | Filtro removido, URL actualizada |
| Q5 | Empty state | Cat con 0 providers | Copy warm + CTA |
| Q6 | Infinite scroll | Scroll al final | Carga siguiente página |
| Q7 | Load more fallback | Tras 3 auto-loads | Botón "Cargar más" aparece |
| Q8 | SEO title | GET con `?categoria=catering` | Title incluye "Catering" |
| Q9 | No approved no aparece | Provider status=pending | No en resultados |
| Q10 | Premium primero | Ordenar "destacados" | Premium providers primero en el grid |
| Q11 | Click card | Click | Navega a `/marketplace/[slug]` |
| Q12 | Mobile chips scroll | Mobile viewport | Chips horizontal scroll sin overflow page |
| Q13 | LCP | Lighthouse mobile | LCP < 2.5s |
| Q14 | A11y | Keyboard navigation | Todos filtros y cards tabulables |
| Q15 | Filter empty message | Cat + región sin match | "Sugerimos quitar región" |

## Non-functional

- Lighthouse Performance mobile ≥ 85.
- Bundle JS del listing page < 150kb gzipped.
- FCP < 1.2s en 4G simulado.

## Regression

- Validar que `/invitacion/*` no está tocado.
- Validar que `/panel` no se rompe.

## Sign-off

- [ ] Q1–Q15 passed.
- [ ] Lighthouse corrido y aceptable.
- [ ] 20 providers seed en staging para testing realista.
