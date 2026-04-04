-- Acompañantes de cada invitado (varios por invitación). La tabla `parejas` sigue siendo solo los novios.
-- Ejecutar en SQL Editor de Supabase.

create table if not exists public.invitado_acompanantes (
  id uuid primary key default gen_random_uuid(),
  invitado_id uuid not null references public.invitados (id) on delete cascade,
  nombre text not null,
  orden smallint not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_invitado_acompanantes_invitado
  on public.invitado_acompanantes (invitado_id);

alter table public.invitado_acompanantes enable row level security;

drop policy if exists "invitado_acompanantes_select_public" on public.invitado_acompanantes;
drop policy if exists "invitado_acompanantes_insert_own" on public.invitado_acompanantes;
drop policy if exists "invitado_acompanantes_update_own" on public.invitado_acompanantes;
drop policy if exists "invitado_acompanantes_delete_own" on public.invitado_acompanantes;

create policy "invitado_acompanantes_select_public" on public.invitado_acompanantes
  for select using (true);

create policy "invitado_acompanantes_insert_own" on public.invitado_acompanantes
  for insert with check (
    exists (
      select 1 from public.invitados i
      where i.id = invitado_id
        and (
          i.owner_user_id = auth.uid()
          or exists (
            select 1 from public.parejas p
            where p.id = i.pareja_id and p.user_id = auth.uid()
          )
        )
    )
  );

create policy "invitado_acompanantes_update_own" on public.invitado_acompanantes
  for update using (
    exists (
      select 1 from public.invitados i
      where i.id = invitado_id
        and (
          i.owner_user_id = auth.uid()
          or exists (
            select 1 from public.parejas p
            where p.id = i.pareja_id and p.user_id = auth.uid()
          )
        )
    )
  );

create policy "invitado_acompanantes_delete_own" on public.invitado_acompanantes
  for delete using (
    exists (
      select 1 from public.invitados i
      where i.id = invitado_id
        and (
          i.owner_user_id = auth.uid()
          or exists (
            select 1 from public.parejas p
            where p.id = i.pareja_id and p.user_id = auth.uid()
          )
        )
    )
  );

-- Migrar dato antiguo (una sola columna) a filas en la nueva tabla
insert into public.invitado_acompanantes (invitado_id, nombre, orden)
select i.id, trim(i.nombre_acompanante), 0
from public.invitados i
where i.nombre_acompanante is not null
  and trim(i.nombre_acompanante) <> ''
  and not exists (
    select 1 from public.invitado_acompanantes a where a.invitado_id = i.id
  );

notify pgrst, 'reload schema';
