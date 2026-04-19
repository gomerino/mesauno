# Technical spec — M04 Marketplace listing redesign

## Server-side rendering

- `/marketplace/page.tsx` como Server Component.
- Query parameters parseados desde `searchParams`.
- Query a Supabase:
  ```ts
  await supabase.from("providers")
    .select("id, slug, business_name, tagline, primary_category, region, plan, provider_media!inner(public_url, sort_order)")
    .eq("status", "approved")
    .match({ /* filtros */ })
    .order("plan", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  ```
- Hidratación client para filtros interactivos (componente `MarketplaceFilters` ya existe, ampliar).

## Data shape

```ts
type MarketplaceCard = {
  id: string;
  slug: string;
  business_name: string;
  tagline: string | null;
  primary_category: ProviderCategory;
  region: string;
  plan: ProviderPlan;
  hero_image_url: string | null;     // primera foto o null
  price_from_clp: number | null;      // min de provider_services o null
};
```

- Vista SQL o query JOIN para calcular `hero_image_url` y `price_from_clp` en el server:
  ```sql
  create or replace view public.v_marketplace_cards as
  select
    p.id, p.slug, p.business_name, p.tagline, p.primary_category, p.region, p.plan,
    (select pm.public_url from provider_media pm where pm.provider_id = p.id order by pm.sort_order asc limit 1) as hero_image_url,
    (select min(ps.price_from_clp) from provider_services ps where ps.provider_id = p.id and ps.is_active = true) as price_from_clp,
    p.created_at
  from providers p
  where p.status = 'approved';
  ```

## Filters spec

```ts
type MarketplaceFilters = {
  categoria?: ProviderCategory;
  region?: string;
  precio?: "lt-500k" | "500k-1m" | "1m-3m" | "gt-3m";
  orden?: "destacados" | "nuevos" | "precio-asc";
  page?: number;
};
```

- Parser helper `src/lib/marketplace/filters.ts` con `parseFilters(searchParams)` + `buildQuery(filters)`.
- URL state usando `useRouter` + `useSearchParams` en client component.

## Ranking (orden "destacados")

Fórmula simple v1:
```
rank_score = (plan = 'premium' ? 100 : 0)
           + least(media_count, 6) * 5
           + (leads_this_month > 0 ? 10 : 0)
           + recency_decay(created_at)   -- e.g. exp(-days/60)
```

- Pre-calcular en vista SQL o en query con CTE.
- Evitar randomness (debe ser determinístico para misma query).

## Pagination

- `limit = 24` (múltiplo de 3 y 2 para grids).
- Offset pagination OK para MVP; cursor si > 1000 providers.
- Infinite scroll: `IntersectionObserver` en sentinel al final del grid.

## Image optimization

- `next/image` con `sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"`.
- Placeholder blur generado server-side (opcional, post-MVP usar `placeholder="empty"` con CSS skeleton).
- Storage URLs deben ser públicas (ya configurado en M01).

## SEO

- Metadata dinámico con `generateMetadata`:
  ```ts
  export async function generateMetadata({ searchParams }) {
    const { categoria, region } = parseFilters(searchParams);
    const title = categoria
      ? `${categoriaLabel(categoria)}${region ? ` en ${region}` : ""} · Jurnex`
      : "Marketplace de profesionales · Jurnex";
    return { title, openGraph: { ... } };
  }
  ```
- `robots.txt` permite `/marketplace/*`.
- Sitemap dinámico con slugs de providers approved.

## Risks

- **Query performance:** sin índices, 1000+ providers será lento. Índices en (`status`, `primary_category`, `region`) críticos.
- **N+1:** la vista hace subqueries por row; para > 1000 providers, refactor a join explícito o vista materializada refreshed hourly.
- **Stale ranking:** si no refrescamos vista, ordenamiento lag. En MVP el volumen no lo amerita.
