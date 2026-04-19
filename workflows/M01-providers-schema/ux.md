# UX notes — M01 Providers schema

Esta HU es **infra**. No tiene UI visible directa. Sin embargo, define contratos que impactan UX de M02–M08:

## Contratos UX garantizados por el schema

- **Slug legible** (`providers.slug`) habilita URLs bonitas `/marketplace/studio-luz` en lugar de UUIDs.
- **`primary_category`** enumerado → filtros predecibles, consistencia visual en badges.
- **`status = 'approved'` como gatekeeper** → novios nunca ven perfiles a medio terminar.
- **`leads_this_month`** → permite mostrar estados como "Quedan 2 leads este mes" en el panel proveedor sin round-trip extra.
- **`provider_wishlist` con UNIQUE** → "Agregar a mi evento" es idempotente; no se duplican cards.
- **`day_bucket` en leads** → evita spam UX sin UX fea de captcha.

## Decisiones de copy heredadas

- Internamente "provider", externamente **"proveedor"** o **"profesional"**. Nunca "vendor", "supplier".
- Internamente "lead", externamente **"solicitud de contacto"** o **"mensaje"**.
- Internamente "wishlist", externamente **"Agregado a tu viaje"** o **"En tu equipo de evento"**.

## No UI en este ticket

Solo tipos y contratos. Las decisiones visuales van en M02–M08.
