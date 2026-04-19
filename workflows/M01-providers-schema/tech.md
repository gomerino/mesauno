# Technical spec — M01 Providers schema

## Domain model

```
auth.users  ──1:N──  providers (optional 1:1 per user in MVP)
                       │
                       ├──1:N──  provider_services
                       │             │
                       │             └──1:N──  provider_media (service-scoped)
                       │
                       ├──1:N──  provider_media (provider-scoped)
                       └──1:N──  provider_leads  ──N:1──  eventos

eventos   ──1:N──  provider_wishlist  ──N:1──  providers
                                       └N:1──  provider_services (optional)
```

## Table DDL sketch

### `providers`
```sql
create table public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  business_name text not null,
  tagline text,
  bio text,
  region text not null,                         -- ej. "Región Metropolitana"
  city text,
  primary_category text not null,               -- fotografia | catering | musica | lugar | decoracion | flores
  phone text,
  email text,
  website text,
  instagram text,
  whatsapp text,                                -- formato E.164
  status text not null default 'pending'
    check (status in ('pending','approved','suspended')),
  plan text not null default 'free'
    check (plan in ('free','premium')),
  plan_started_at timestamptz,
  leads_this_month int not null default 0,      -- contador reseteado via cron
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)                              -- 1 provider per user en MVP
);
create index providers_status_category_idx on public.providers(status, primary_category);
create index providers_region_idx on public.providers(region);
```

### `provider_services`
```sql
create table public.provider_services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  name text not null,
  description text,
  category text not null,                       -- hereda o refina primary_category
  price_from_clp numeric,                       -- null si "consultar"
  duration_minutes int,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index provider_services_provider_idx on public.provider_services(provider_id);
```

### `provider_media`
```sql
create table public.provider_media (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  service_id uuid references public.provider_services(id) on delete set null,
  kind text not null check (kind in ('image','video')),
  storage_path text not null,                   -- ruta en bucket `provider-media`
  public_url text not null,
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index provider_media_provider_idx on public.provider_media(provider_id);
```

### `provider_leads`
```sql
create table public.provider_leads (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  evento_id uuid references public.eventos(id) on delete set null,
  sender_user_id uuid references auth.users(id) on delete set null,
  channel text not null check (channel in ('whatsapp','email','in_app')),
  message text,
  context_date text,                            -- ISO YYYY-MM-DD fecha del evento si disponible
  context_region text,
  context_budget_clp numeric,
  day_bucket date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  unique (provider_id, sender_user_id, channel, day_bucket)
);
create index provider_leads_provider_idx on public.provider_leads(provider_id, created_at desc);
```

### `provider_wishlist`
```sql
create table public.provider_wishlist (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  service_id uuid references public.provider_services(id) on delete set null,
  added_by uuid not null references auth.users(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (evento_id, provider_id, service_id)
);
create index provider_wishlist_evento_idx on public.provider_wishlist(evento_id);
```

## RLS policies

### `providers`
```sql
alter table public.providers enable row level security;

-- Lectura pública solo approved
create policy providers_public_read on public.providers
  for select using (status = 'approved');

-- Owner read/write su propio perfil (cualquier status)
create policy providers_owner_all on public.providers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### `provider_services` / `provider_media`
- Lectura pública si el provider padre está approved (join por JSONB policy o EXISTS subquery).
- Escritura solo por owner del provider (EXISTS subquery por `provider_id` → `providers.user_id = auth.uid()`).

### `provider_leads`
- SELECT: `auth.uid() IN (providers.user_id WHERE id=provider_id, sender_user_id)`.
- INSERT: cualquier `auth.role() = 'authenticated'`.
- UPDATE/DELETE: solo owner del provider.

### `provider_wishlist`
- CRUD solo para miembros del `evento_id` vía `evento_miembros` (patrón ya en el proyecto).

## Storage bucket

```sql
-- Via Supabase API o migration complementaria
insert into storage.buckets (id, name, public) values ('provider-media','provider-media', true);
create policy "provider_media_upload" on storage.objects
  for insert with check (bucket_id = 'provider-media' and auth.role() = 'authenticated');
create policy "provider_media_read" on storage.objects
  for select using (bucket_id = 'provider-media');
```

## TypeScript types (append a `src/types/database.ts`)

```ts
export type ProviderStatus = "pending" | "approved" | "suspended";
export type ProviderPlan = "free" | "premium";
export type ProviderCategory =
  | "fotografia" | "catering" | "musica" | "lugar"
  | "decoracion" | "flores" | "video" | "coordinacion";

export type Provider = {
  id: string;
  user_id: string;
  slug: string;
  business_name: string;
  tagline: string | null;
  bio: string | null;
  region: string;
  city: string | null;
  primary_category: ProviderCategory;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  whatsapp: string | null;
  status: ProviderStatus;
  plan: ProviderPlan;
  plan_started_at: string | null;
  leads_this_month: number;
  created_at: string;
  updated_at: string;
};

export type ProviderService = {
  id: string;
  provider_id: string;
  name: string;
  description: string | null;
  category: ProviderCategory;
  price_from_clp: number | null;
  duration_minutes: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type ProviderMedia = {
  id: string;
  provider_id: string;
  service_id: string | null;
  kind: "image" | "video";
  storage_path: string;
  public_url: string;
  alt: string | null;
  sort_order: number;
  created_at: string;
};

export type ProviderLead = {
  id: string;
  provider_id: string;
  evento_id: string | null;
  sender_user_id: string | null;
  channel: "whatsapp" | "email" | "in_app";
  message: string | null;
  context_date: string | null;
  context_region: string | null;
  context_budget_clp: number | null;
  day_bucket: string;
  created_at: string;
};

export type ProviderWishlistItem = {
  id: string;
  evento_id: string;
  provider_id: string;
  service_id: string | null;
  added_by: string;
  note: string | null;
  created_at: string;
};
```

## Domain helpers (`src/lib/providers/`)

- `src/lib/providers/queries.ts` — `listApprovedProviders(filters)`, `getProviderBySlug(slug)`, `listServices(providerId)`, `listMedia(providerId)`.
- `src/lib/providers/leads.ts` — `createLead(input)` con check de `UNIQUE` + respuesta friendly si duplicado.
- `src/lib/providers/wishlist.ts` — `addToWishlist(eventoId, providerId, serviceId?)`, `removeFromWishlist(id)`.

## Migration strategy

1. Crear archivo `supabase/migration_marketplace_providers.sql` forward-only.
2. Ejecutar en staging primero.
3. Rollback documentado: `DROP TABLE` en orden inverso de FK + `DROP POLICY` + `DROP BUCKET`.
4. Mantener `marketplace_servicios` existente como `DEPRECATED` con comentario SQL, sin eliminarla todavía (rollback seguro). Eliminación en issue separado tras 30 días.

## Risks

- **FK cascade `auth.users`:** si borramos un user se lleva todo; confirmar con Supabase Auth deletion policy.
- **RLS performance:** policies con EXISTS pueden ser lentas en lists grandes; indexar `providers.status` y `providers.primary_category`.
- **Storage leak:** si borran row de `provider_media` pero no el objeto en Storage. Cleanup job o trigger que borra storage.
- **Reseteo `leads_this_month`:** requiere cron (pg_cron o Edge Function diaria). Documentar fuera de scope en M01; crear ticket separado M01b.
