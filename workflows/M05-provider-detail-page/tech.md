# Technical spec — M05 Provider detail page

## Route

- `src/app/marketplace/[slug]/page.tsx` — Server Component.
- `generateStaticParams` opcional para SSG de top-100 providers (cache-warm).
- Fetch:
  ```ts
  const { data: provider } = await supabase
    .from("providers")
    .select(`
      *,
      provider_media (id, kind, public_url, alt, sort_order, service_id),
      provider_services!inner (id, name, description, category, price_from_clp, duration_minutes, sort_order)
    `)
    .eq("slug", params.slug)
    .eq("status", "approved")
    .eq("provider_services.is_active", true)
    .single();
  if (!provider) notFound();
  ```

## 404 handling

- Supabase `single()` devuelve null si no match → `notFound()` de Next.
- `not-found.tsx` custom con copy warm + CTA volver.

## Metadata

```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const provider = await getProviderBySlug(params.slug);
  if (!provider) return { title: "Proveedor no encontrado" };
  return {
    title: `${provider.business_name} · ${categoryLabel(provider.primary_category)} en ${provider.region} · Jurnex`,
    description: provider.tagline ?? truncate(provider.bio ?? "", 150),
    openGraph: {
      title: provider.business_name,
      description: provider.tagline,
      images: [provider.hero_image_url ?? "/og-default.jpg"],
    },
  };
}
```

## JSON-LD

```tsx
<script type="application/ld+json">{JSON.stringify({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": provider.business_name,
  "description": provider.bio,
  "image": provider.hero_image_url,
  "address": { "@type": "PostalAddress", "addressRegion": provider.region },
  "url": `https://jurnex.cl/marketplace/${provider.slug}`,
})}</script>
```

## Lightbox

- Componente client `src/components/marketplace/Lightbox.tsx`.
- Maneja swipe con `touchstart`/`touchend`.
- Bloquea body scroll al abrir.
- Keyboard: Esc cierra, ← → navega.

## Wishlist CTA

- Click → si no auth: redirect a login con `?next=/marketplace/[slug]&action=wishlist`.
- Si auth: POST a `/api/wishlist` con `{ provider_id, evento_id }`.
- UI optimistic: corazón lleno inmediatamente, rollback si error.

## Share

```ts
async function share(provider) {
  const url = window.location.href;
  if (navigator.share) {
    await navigator.share({ title: provider.business_name, url });
  } else {
    await navigator.clipboard.writeText(url);
    toast("Copiado ✓");
  }
}
```

## Performance

- Hero image con `priority` prop (LCP).
- Portfolio imgs con `loading="lazy"`.
- Prefetch `/api/wishlist` en hover del botón (optimistic).

## Risks

- **Slug editable:** si el provider cambia business_name en M03, el slug puede cambiar. Decisión: slug **inmutable post-creación** (guardar `slug_history` si renombran en futuro).
- **Lightbox accesibilidad:** focus trap + aria-modal correctos.
- **JSON-LD errors:** validar con Schema Markup Validator antes de prod.
