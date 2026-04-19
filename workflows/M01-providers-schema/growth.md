# Growth — M01 Providers schema

## Hipótesis habilitadas (no testeadas en este ticket)

| ID | Hypothesis | Metric |
|---|---|---|
| HG1 | Providers con ≥3 fotos en portfolio reciben 2x más leads que con 0–2 | lead rate por tier de fotos |
| HG2 | Providers premium generan 3x más contactos que free (segmento vs cap de leads) | leads/provider/mes por plan |
| HG3 | Categorías visuales (fotografia/lugar/flores) convierten mejor que operacionales (catering/música) | conversion view→lead |

## Supply-side tactics futuras (enabled por schema)

- Ranking: boost providers con `leads_this_month` alto Y media ≥ 3 fotos.
- Badge "Nuevo en Jurnex" automático primeros 30 días post-approved.
- Email semanal a providers con `leads_this_month > 0` para activar plan premium.

## Guardrails

- No mostrar `leads_this_month` públicamente (interno).
- No rankear por recency sola (favorece spam nuevos).
- Cero scarcity fake ("Solo 2 quedan") hasta tener booking real.
