-- Parche: corrige recursión infinita en RLS sobre evento_miembros.
-- Ejecutar UNA VEZ en SQL Editor (después de migrate_parejas_a_eventos u otra migración previa).
--
-- Invitados: la política INSERT no debe usar user_is_evento_member() en WITH CHECK (fallos opacos si la
-- función no ve filas). Se usa EXISTS sobre evento_miembros y SELECT en esa tabla solo por user_id.
--
-- Vuelve a ejecutar este bloque de funciones si `user_is_evento_member` devolvía siempre false (p. ej. invitados).
--
-- Nota INSERT desde el cliente: no uses insert().select() en PostgREST para `eventos`. En PostgreSQL el
-- RETURNING se evalúa antes que los triggers AFTER INSERT, así que `evento_miembros` aún no tiene fila
-- y la política SELECT falla. El panel ya hace insert sin .select().
--
-- Si al actualizar un evento ves "new row violates row-level security" en UPDATE: falta membresía.
-- Añade una fila (UUIDs de Authentication → Users y del evento en Table Editor):
--   insert into public.evento_miembros (evento_id, user_id, rol)
--   values ('<uuid_evento>', '<uuid_usuario>', 'admin')
--   on conflict (evento_id, user_id) do nothing;

-- 1) Funciones SECURITY DEFINER: leen evento_miembros sin aplicar RLS (row_security off evita que FORCE RLS
--    u otras reglas oculten filas dentro de la función).
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

-- 2) Quitar políticas antiguas que hacían SELECT directo en evento_miembros
drop policy if exists "eventos_select" on public.eventos;
drop policy if exists "eventos_insert" on public.eventos;
drop policy if exists "eventos_update" on public.eventos;
drop policy if exists "eventos_delete" on public.eventos;
drop policy if exists "eventos_member_all" on public.eventos;
drop policy if exists "eventos_insert_authenticated" on public.eventos;
drop policy if exists "parejas_own" on public.eventos;

create policy "eventos_select" on public.eventos
  for select using (public.user_is_evento_member(id));

create policy "eventos_insert" on public.eventos
  for insert with check (auth.uid() is not null);

create policy "eventos_update" on public.eventos
  for update using (public.user_is_evento_member(id))
  with check (public.user_is_evento_member(id));

create policy "eventos_delete" on public.eventos
  for delete using (public.user_is_evento_admin(id));

drop policy if exists "evento_miembros_select" on public.evento_miembros;
drop policy if exists "evento_miembros_insert_block" on public.evento_miembros;
drop policy if exists "evento_miembros_insert_admin" on public.evento_miembros;
drop policy if exists "evento_miembros_delete" on public.evento_miembros;

create policy "evento_miembros_select" on public.evento_miembros
  for select using (user_id = auth.uid());

-- Inserción solo vía trigger SECURITY DEFINER o service_role / API admin
create policy "evento_miembros_insert_block" on public.evento_miembros
  for insert with check (false);

create policy "evento_miembros_delete" on public.evento_miembros
  for delete using (
    exists (
      select 1 from public.evento_miembros me
      where me.evento_id = evento_miembros.evento_id
        and me.user_id = auth.uid()
        and me.rol = 'admin'
    )
  );

-- Trigger: valida membresía y fija owner_user_id ANTES del WITH CHECK (evita fallos opacos de RLS).
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

-- Quitar cualquier otra política INSERT (p. ej. nombres en español) que siga aplicando WITH CHECK estricto.
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

drop policy if exists "invitados_update_own" on public.invitados;
drop policy if exists "invitados_delete_own" on public.invitados;

-- Sin "TO authenticated": en algunos despliegues el rol de sesión no coincide y la política no aplica.
-- Esto es el patrón típico Supabase: cualquier rol con JWT de usuario pasa; anon sin sesión falla (uid null).
create policy "invitados_insert_own" on public.invitados
  for insert
  with check (auth.uid() is not null);

create policy "invitados_update_own" on public.invitados
  for update using (
    public.user_is_evento_member(evento_id)
    or owner_user_id = auth.uid()
  );

create policy "invitados_delete_own" on public.invitados
  for delete using (
    public.user_is_evento_member(evento_id)
    or owner_user_id = auth.uid()
  );

drop policy if exists "invitado_acompanantes_insert_own" on public.invitado_acompanantes;
drop policy if exists "invitado_acompanantes_update_own" on public.invitado_acompanantes;
drop policy if exists "invitado_acompanantes_delete_own" on public.invitado_acompanantes;

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

drop policy if exists "aportes_regalo_select" on public.aportes_regalo;
drop policy if exists "aportes_regalo_insert" on public.aportes_regalo;
drop policy if exists "aportes_regalo_update" on public.aportes_regalo;
drop policy if exists "aportes_regalo_delete" on public.aportes_regalo;

create policy "aportes_regalo_select" on public.aportes_regalo
  for select using (public.user_is_evento_member(evento_id));

create policy "aportes_regalo_insert" on public.aportes_regalo
  for insert with check (public.user_is_evento_member(evento_id));

create policy "aportes_regalo_update" on public.aportes_regalo
  for update using (public.user_is_evento_member(evento_id));

create policy "aportes_regalo_delete" on public.aportes_regalo
  for delete using (public.user_is_evento_member(evento_id));

-- Panel: INSERT vía RPC (evita 42501 en PostgREST cuando RLS del INSERT sigue fallando).
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

notify pgrst, 'reload schema';
