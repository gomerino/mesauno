# Validation — M05 Provider detail page

## Problem

Sin detalle rico, el novio no puede evaluar. Hoy `marketplace_servicios` solo tiene texto plano sin portfolio, sin CTAs claros.

## Success criteria

- [ ] Contact conversion ≥ 8% (contact_cta_clicked / provider_viewed).
- [ ] Wishlist rate ≥ 10%.
- [ ] Avg scroll depth ≥ 60%.
- [ ] 404s no rompen UX; redirect amigable.

## Validation checklist

1. **PM:** AC firmados, SEO strategy revisada.
2. **UX:** Mockups + copy warm validados; responsive ok.
3. **Tech:** Query + RLS validados; JSON-LD validator passed.
4. **QA:** Q1–Q17 passed.
5. **Data:** Eventos verificados en staging.
6. **Growth:** Sitemap + OG previews verificados.

## Rollout

- Se activa junto con M04 bajo mismo feature flag `MARKETPLACE_V1`.
- Requiere M06 listo para que el CTA primario funcione completamente.
