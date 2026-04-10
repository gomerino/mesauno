-- Álbum de fotos compartido (invitación pública + subida vía API con service_role).

-- Bucket público de lectura; las subidas las hace el backend con service_role (bypass RLS).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos_eventos',
  'fotos_eventos',
  true,
  12582912,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fotos_eventos_public_read" on storage.objects;
create policy "fotos_eventos_public_read"
  on storage.objects for select
  using (bucket_id = 'fotos_eventos');

create table if not exists public.evento_fotos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  invitado_id uuid references public.invitados (id) on delete set null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  constraint evento_fotos_storage_path_unique unique (storage_path)
);

create index if not exists idx_evento_fotos_evento_created on public.evento_fotos (evento_id, created_at desc);

alter table public.evento_fotos enable row level security;

-- Lectura amplia para invitados anónimos + Realtime (filtro por evento_id en el cliente).
-- Las URLs siguen siendo difíciles de enumerar sin el id de evento; el álbum se muestra solo en la invitación.
create policy "evento_fotos_select_public" on public.evento_fotos
  for select using (true);

create policy "evento_fotos_insert_block" on public.evento_fotos
  for insert with check (false);

create policy "evento_fotos_update_block" on public.evento_fotos
  for update using (false);

create policy "evento_fotos_delete_block" on public.evento_fotos
  for delete using (false);

create or replace function public.fotos_evento_lista_publica(p_token text)
returns setof public.evento_fotos
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select f.*
  from public.evento_fotos f
  inner join public.invitados i on i.evento_id = f.evento_id
  where i.evento_id is not null
    and (
      i.id::text = p_token
      or (i.token_acceso is not null and i.token_acceso::text = p_token)
    )
  order by f.created_at desc;
$$;

revoke all on function public.fotos_evento_lista_publica(text) from public;
grant execute on function public.fotos_evento_lista_publica(text) to anon;
grant execute on function public.fotos_evento_lista_publica(text) to authenticated;
grant execute on function public.fotos_evento_lista_publica(text) to service_role;

-- Realtime: si ya está añadida la tabla, este comando puede fallar; ignorar en ese caso.
alter publication supabase_realtime add table public.evento_fotos;
