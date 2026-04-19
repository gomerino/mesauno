# Growth — M02 Provider onboarding

## Funnel supply

```
landing_viewed → registration_started → step1 → step2 → step3 → registration_completed → provider_approved → first_lead
```

Target benchmarks (post-lanzamiento):

- landing → start: ≥ 30%
- start → complete: ≥ 50%
- complete → approved: ≥ 80% (la otra 20% suspend = filtro calidad intencional)
- approved → first_lead (30d): ≥ 60% (si < 40%, problema de demanda no de supply)

## Hypotheses

| ID | Hypothesis | Metric |
|---|---|---|
| HG1 | Mostrar "gratis, sin tarjeta" en landing aumenta landing → start en ≥ 15% | conversion rate |
| HG2 | Limitar paso 2 a sólo nombre + categoría + región aumenta step1 → step2 en ≥ 20% | funnel |
| HG3 | Email de bienvenida con preview del perfil reduce abandono post-registro | activation rate D1 |

## On-site tactics (MVP-compatible)

- Landing: mostrar avatares/logos de proveedores aprobados como social proof (con consentimiento).
- Copy variant A: "Llega a novios que te están buscando".
- Copy variant B: "Tu agenda, llena. Tus novios, felices".
- En paso 3, mostrar thumbnails preview cómo se verá la card en el marketplace.

## Acquisition channels (fuera de scope técnico, para planning)

- SEO: slug URLs `/marketplace/categoria/[cat]` indexables.
- Instagram ads segmentación geo + intereses.
- Partnership con wedding planners para referidos.

## Guardrails

- NUNCA aprobar un provider automáticamente en MVP (manual review).
- Cero scarcity fake.
- Emails transaccionales solo (no newsletter sin opt-in).
