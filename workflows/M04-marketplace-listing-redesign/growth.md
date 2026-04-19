# Growth — M04 Marketplace listing

## Hypotheses

| ID | Hypothesis | Metric |
|---|---|---|
| HG1 | Hero warm + ilustración aumenta scroll-to-grid vs hero transaccional en +30% | scroll depth 50% |
| HG2 | Filtro categoría como chips vs dropdown aumenta filter engagement en +40% | % users aplican filtro |
| HG3 | Premium primero en orden default aumenta upgrade intent entre free providers | upgrade CTA clicks |

## SEO strategy

- URLs limpias: `/marketplace?categoria=fotografia` (OK MVP) pero ideal en v2: `/marketplace/fotografia` como ruta estática generada.
- Slugs únicos para providers: `/marketplace/studio-luz`.
- Schema.org `LocalBusiness` en detalle (M05) — no aplica a listado directo.
- Sitemap con providers approved regenerado diario.

## On-site tactics

- **Social proof:** "Más de X proveedores en Jurnex" en hero (solo si X ≥ 50).
- **Recently added badge:** "Nuevo en Jurnex" primeros 30 días post-approval.
- **Region suggestion:** si el novio tiene `evento.region` en sesión, pre-seleccionar ese filtro.

## Guardrails

- NO mostrar "Solo quedan X" (no hay urgencia real).
- NO inflar contador de providers.
- NO penalizar free tier en la UX (solo en ranking leve).
