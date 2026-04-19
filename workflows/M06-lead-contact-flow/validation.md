# Validation — M06 Lead contact flow

## Problem

Sin flujo de contacto, el marketplace es un catálogo estático. El lead es la unidad económica mínima de un marketplace de dos lados; sin él, no hay producto.

## Success criteria

- [ ] Submit rate (modal → submit) ≥ 60%.
- [ ] 0 leads duplicados mismo día (constraint + UX).
- [ ] Provider recibe email < 2 min post-submit.
- [ ] `plan_capped` bien aplicado (no notifica cuando capped).
- [ ] Copy warm validado con 3 novios reales (betatesters).

## Validation checklist

1. **PM:** AC firmados; copy revisado.
2. **UX:** Modal responsive probado; flujo auth inline validado.
3. **Tech:** Transactional insert + trigger counter + emails no bloqueantes.
4. **QA:** Q1–Q17 passed.
5. **Data:** Funnel completo en dashboard; `plan_capped` trackeable.
6. **Growth:** Copy "similares post-submit" validado.

## Rollout

- Requires M05 live.
- Shadow mode primero: leads se crean en DB pero sin email al provider (verificar volumen y calidad).
- Turn on emails tras 1 semana shadow sin issues.
- Go live público.
