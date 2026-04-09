-- Migración: parejas → eventos + evento_miembros (varios usuarios por evento).
-- Ejecutar UNA VEZ en SQL Editor si ya tienes datos en `parejas`.
-- Orden: 1) esto 2) despliega código nuevo

-- Tabla de membresía (idempotente)
create table if not exists public.evento_miembros (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.parejas (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rol text not null default 'editor' check (rol in ('admin', 'editor')),
  created_at timestamptz default now(),
  unique (evento_id, user_id)
);

create index if not exists idx_evento_miembros_user on public.evento_miembros (user_id);
create index if not exists idx_evento_miembros_evento on public.evento_miembros (evento_id);

-- Poblar desde user_id / user_id_2 si aún está vacía
insert into public.evento_miembros (evento_id, user_id, rol)
select id, user_id, 'admin'
from public.parejas p
where not exists (select 1 from public.evento_miembros m where m.evento_id = p.id and m.user_id = p.user_id);

insert into public.evento_miembros (evento_id, user_id, rol)
select id, user_id_2, 'editor'
from public.parejas p
where p.user_id_2 is not null
  and not exists (select 1 from public.evento_miembros m where m.evento_id = p.id and m.user_id = p.user_id_2);

alter table public.evento_miembros enable row level security;

-- Renombrar FKs en hijos antes de tocar parejas
alter table public.invitados rename column pareja_id to evento_id;
alter table public.aportes_regalo rename column pareja_id to evento_id;

-- Renombrar tabla parejas → eventos
alter table public.parejas rename to eventos;

-- Actualizar FKs que apuntaban a parejas (PostgreSQL actualiza el nombre de la FK al renombrar tabla en versiones recientes; por si acaso):
alter table public.invitados drop constraint if exists invitados_pareja_id_fkey;
alter table public.invitados
  add constraint invitados_evento_id_fkey foreign key (evento_id) references public.eventos (id) on delete set null;

alter table public.aportes_regalo drop constraint if exists aportes_regalo_pareja_id_fkey;
alter table public.aportes_regalo
  add constraint aportes_regalo_evento_id_fkey foreign key (evento_id) references public.eventos (id) on delete cascade;

-- Las políticas RLS suelen referenciar eventos.user_id / parejas.user_id. Hay que quitarlas ANTES de DROP COLUMN.
-- Incluye políticas con nombres custom (p. ej. en español) además de las del repo.
do $$
declare
  r record;
begin
  for r in (
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('eventos', 'invitados', 'invitado_acompanantes', 'aportes_regalo')
  ) loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- Quitar columnas de usuario de eventos (la membresía pasa a evento_miembros)
alter table public.eventos drop constraint if exists parejas_user_id_fkey;
alter table public.eventos drop constraint if exists parejas_user_id_2_fkey;
alter table public.eventos drop constraint if exists eventos_user_id_fkey;
alter table public.eventos drop constraint if exists eventos_user_id_2_fkey;
alter table public.eventos drop constraint if exists parejas_user_id_key;
alter table public.eventos drop constraint if exists eventos_user_id_key;
drop index if exists public.parejas_user_id_2_unique;
drop index if exists public.eventos_user_id_2_unique;
-- CASCADE elimina cualquier dependencia residual (p. ej. políticas no listadas en pg_policies en edge cases)
alter table public.eventos drop column if exists user_id cascade;
alter table public.eventos drop column if exists user_id_2 cascade;

-- Trigger: al crear un evento nuevo, el creador queda como admin en evento_miembros
create or replace function public.trg_eventos_add_creator_member()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid() is not null then
    insert into public.evento_miembros (evento_id, user_id, rol)
    values (new.id, auth.uid(), 'admin')
    on conflict (evento_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists eventos_after_insert_member on public.eventos;
create trigger eventos_after_insert_member
  after insert on public.eventos
  for each row
  execute procedure public.trg_eventos_add_creator_member();

-- Evitar recursión infinita en RLS sobre evento_miembros (no hacer SELECT en esa tabla desde sus propias políticas).
create or replace function public.user_is_evento_member(p_evento_id uuid)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
stable
as $$
  select exists (
    select 1 from public.evento_miembros m
    where m.evento_id = p_evento_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.user_is_evento_admin(p_evento_id uuid)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
stable
as $$
  select exists (
    select 1 from public.evento_miembros m
    where m.evento_id = p_evento_id and m.user_id = auth.uid() and m.rol = 'admin'
  );
$$;

grant execute on function public.user_is_evento_member(uuid) to authenticated;
grant execute on function public.user_is_evento_admin(uuid) to authenticated;

-- Políticas evento_miembros
drop policy if exists "evento_miembros_select" on public.evento_miembros;
create policy "evento_miembros_select" on public.evento_miembros
  for select using (user_id = auth.uid());

drop policy if exists "evento_miembros_insert_admin" on public.evento_miembros;
drop policy if exists "evento_miembros_insert_block" on public.evento_miembros;
-- Solo service_role o inserciones desde trigger (definer); invitaciones las hace la API admin
create policy "evento_miembros_insert_admin" on public.evento_miembros
  for insert with check (false);

drop policy if exists "evento_miembros_delete" on public.evento_miembros;
create policy "evento_miembros_delete" on public.evento_miembros
  for delete using (
    exists (
      select 1 from public.evento_miembros me
      where me.evento_id = evento_miembros.evento_id
        and me.user_id = auth.uid()
        and me.rol = 'admin'
    )
  );

-- Reemplazar políticas que mencionaban parejas / user_id
drop policy if exists "parejas_own" on public.eventos;
create policy "eventos_member_all" on public.eventos
  for all using (public.user_is_evento_member(id))
  with check (public.user_is_evento_member(id));

-- INSERT en eventos: usuario autenticado (el trigger añade el miembro admin)
drop policy if exists "eventos_insert_authenticated" on public.eventos;
create policy "eventos_insert_authenticated" on public.eventos
  for insert with check (auth.uid() is not null);

-- Combinar: en PG una tabla no puede tener dos FOR ALL fácilmente; simplificamos a políticas separadas
drop policy if exists "eventos_member_all" on public.eventos;
drop policy if exists "eventos_insert_authenticated" on public.eventos;

create policy "eventos_select" on public.eventos
  for select using (public.user_is_evento_member(id));

create policy "eventos_insert" on public.eventos
  for insert with check (auth.uid() is not null);

create policy "eventos_update" on public.eventos
  for update using (public.user_is_evento_member(id))
  with check (public.user_is_evento_member(id));

create policy "eventos_delete" on public.eventos
  for delete using (public.user_is_evento_admin(id));

-- Invitados: trigger BEFORE valida membresía (lee evento_miembros con row_security off); INSERT RLS solo
-- comprueba owner_user_id = auth.uid() tras el trigger.
create or replace function public.trg_invitados_owner_and_evento()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if coalesce(auth.jwt()->>'role', '') = 'service_role' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if auth.uid() is null then
      raise exception 'Sesión requerida' using errcode = '42501';
    end if;
    new.owner_user_id := auth.uid();
  end if;
  if new.evento_id is not null and auth.uid() is not null then
    if not exists (
      select 1 from public.evento_miembros m
      where m.evento_id = new.evento_id and m.user_id = auth.uid()
    ) then
      raise exception 'No eres miembro de este evento' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_invitados_owner_and_evento on public.invitados;
create trigger trg_invitados_owner_and_evento
  before insert or update on public.invitados
  for each row
  execute procedure public.trg_invitados_owner_and_evento();

do $$
declare
  r record;
begin
  for r in (
    select pol.polname as policyname
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'invitados'
      and pol.polcmd = 'a'
  ) loop
    execute format('drop policy if exists %I on public.invitados', r.policyname);
  end loop;
end $$;

create policy "invitados_insert_own" on public.invitados
  for insert
  with check (auth.uid() is not null);

drop policy if exists "invitados_update_own" on public.invitados;
create policy "invitados_update_own" on public.invitados
  for update using (
    public.user_is_evento_member(evento_id)
    or owner_user_id = auth.uid()
  );

drop policy if exists "invitados_delete_own" on public.invitados;
create policy "invitados_delete_own" on public.invitados
  for delete using (
    public.user_is_evento_member(evento_id)
    or owner_user_id = auth.uid()
  );

create or replace function public.insert_invitado_panel(
  p_evento_id uuid,
  p_nombre_pasajero text,
  p_email text default null,
  p_telefono text default null,
  p_asiento text default null,
  p_restricciones_alimenticias text[] default null
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida' using errcode = '42501';
  end if;
  if p_evento_id is not null then
    if not exists (
      select 1 from public.evento_miembros m
      where m.evento_id = p_evento_id and m.user_id = auth.uid()
    ) then
      raise exception 'No eres miembro de este evento' using errcode = '42501';
    end if;
  end if;

  insert into public.invitados (
    evento_id,
    owner_user_id,
    nombre_pasajero,
    email,
    telefono,
    asiento,
    restricciones_alimenticias
  )
  values (
    p_evento_id,
    auth.uid(),
    p_nombre_pasajero,
    p_email,
    p_telefono,
    p_asiento,
    p_restricciones_alimenticias
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.insert_invitado_panel(uuid, text, text, text, text, text[]) from public;
grant execute on function public.insert_invitado_panel(uuid, text, text, text, text, text[]) to authenticated;

-- Acompañantes
drop policy if exists "invitado_acompanantes_insert_own" on public.invitado_acompanantes;
create policy "invitado_acompanantes_insert_own" on public.invitado_acompanantes
  for insert with check (
    exists (
      select 1 from public.invitados i
      where i.id = invitado_id
        and (
          i.owner_user_id = auth.uid()
          or exists (
            select 1 from public.evento_miembros m
            where m.evento_id = i.evento_id
              and m.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "invitado_acompanantes_update_own" on public.invitado_acompanantes;
create policy "invitado_acompanantes_update_own" on public.invitado_acompanantes
  for update using (
    exists (
      select 1 from public.invitados i
      where i.id = invitado_id
        and (
          i.owner_user_id = auth.uid()
          or exists (
            select 1 from public.evento_miembros m
            where m.evento_id = i.evento_id
              and m.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "invitado_acompanantes_delete_own" on public.invitado_acompanantes;
create policy "invitado_acompanantes_delete_own" on public.invitado_acompanantes
  for delete using (
    exists (
      select 1 from public.invitados i
      where i.id = invitado_id
        and (
          i.owner_user_id = auth.uid()
          or exists (
            select 1 from public.evento_miembros m
            where m.evento_id = i.evento_id
              and m.user_id = auth.uid()
          )
        )
    )
  );

-- Aportes
drop policy if exists "aportes_regalo_select" on public.aportes_regalo;
create policy "aportes_regalo_select" on public.aportes_regalo
  for select using (public.user_is_evento_member(evento_id));

drop policy if exists "aportes_regalo_insert" on public.aportes_regalo;
create policy "aportes_regalo_insert" on public.aportes_regalo
  for insert with check (public.user_is_evento_member(evento_id));

drop policy if exists "aportes_regalo_update" on public.aportes_regalo;
create policy "aportes_regalo_update" on public.aportes_regalo
  for update using (public.user_is_evento_member(evento_id));

drop policy if exists "aportes_regalo_delete" on public.aportes_regalo;
create policy "aportes_regalo_delete" on public.aportes_regalo
  for delete using (public.user_is_evento_member(evento_id));

-- RPC: acompañantes desde el panel (misma idea que insert_invitado_panel)
create or replace function public.sync_invitado_acompanantes_panel(
  p_invitado_id uuid,
  p_nombres text[] default '{}'::text[]
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.invitados i
    where i.id = p_invitado_id
      and (
        i.owner_user_id = auth.uid()
        or (
          i.evento_id is not null
          and exists (
            select 1
            from public.evento_miembros m
            where m.evento_id = i.evento_id
              and m.user_id = auth.uid()
          )
        )
      )
  ) then
    raise exception 'No autorizado para editar acompañantes de este invitado' using errcode = '42501';
  end if;

  delete from public.invitado_acompanantes where invitado_id = p_invitado_id;

  if p_nombres is null or coalesce(array_length(p_nombres, 1), 0) = 0 then
    return;
  end if;

  insert into public.invitado_acompanantes (invitado_id, nombre, orden)
  select
    p_invitado_id,
    trim(t.n),
    (t.ord - 1)::smallint
  from unnest(p_nombres) with ordinality as t(n, ord)
  where length(trim(t.n)) > 0;
end;
$$;

revoke all on function public.sync_invitado_acompanantes_panel(uuid, text[]) from public;
grant execute on function public.sync_invitado_acompanantes_panel(uuid, text[]) to authenticated;
