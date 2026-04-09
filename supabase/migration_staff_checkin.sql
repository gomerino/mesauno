-- Check-in personal del centro: rol staff_centro, asistencia, RPCs sin columnas sensibles, RLS aportes.

-- 1) Rol staff_centro en membresías
alter table public.evento_miembros drop constraint if exists evento_miembros_rol_check;
alter table public.evento_miembros
  add constraint evento_miembros_rol_check
  check (rol in ('admin', 'editor', 'staff_centro'));

-- 2) Asistencia presencial
alter table public.invitados add column if not exists asistencia_confirmada boolean not null default false;

-- 3) ¿Es personal del centro para este evento?
create or replace function public.user_is_evento_staff_centro(p_evento_id uuid)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
stable
as $$
  select exists (
    select 1 from public.evento_miembros m
    where m.evento_id = p_evento_id
      and m.user_id = auth.uid()
      and m.rol = 'staff_centro'
  );
$$;

grant execute on function public.user_is_evento_staff_centro(uuid) to authenticated;

-- 4) Novios/editores (no staff del venue) — para políticas de invitados y acompañantes
create or replace function public.user_is_evento_editor_or_admin(p_evento_id uuid)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
stable
as $$
  select exists (
    select 1 from public.evento_miembros m
    where m.evento_id = p_evento_id
      and m.user_id = auth.uid()
      and m.rol in ('admin', 'editor')
  );
$$;

grant execute on function public.user_is_evento_editor_or_admin(uuid) to authenticated;

-- 5) Invitados: staff del centro no puede actualizar/borrar como novios
drop policy if exists "invitados_update_own" on public.invitados;
create policy "invitados_update_own" on public.invitados
  for update using (
    owner_user_id = auth.uid()
    or (
      public.user_is_evento_member(evento_id)
      and not public.user_is_evento_staff_centro(evento_id)
    )
  );

drop policy if exists "invitados_delete_own" on public.invitados;
create policy "invitados_delete_own" on public.invitados
  for delete using (
    owner_user_id = auth.uid()
    or (
      public.user_is_evento_member(evento_id)
      and not public.user_is_evento_staff_centro(evento_id)
    )
  );

drop policy if exists "invitados_insert_own" on public.invitados;
create policy "invitados_insert_own" on public.invitados
  for insert
  with check (
    auth.uid() is not null
    and (evento_id is null or not public.user_is_evento_staff_centro(evento_id))
  );

-- 6) Aportes: ocultos para staff_centro
drop policy if exists "aportes_regalo_select" on public.aportes_regalo;
drop policy if exists "aportes_regalo_insert" on public.aportes_regalo;
drop policy if exists "aportes_regalo_update" on public.aportes_regalo;
drop policy if exists "aportes_regalo_delete" on public.aportes_regalo;

create policy "aportes_regalo_select" on public.aportes_regalo
  for select using (
    public.user_is_evento_member(evento_id)
    and not public.user_is_evento_staff_centro(evento_id)
  );

create policy "aportes_regalo_insert" on public.aportes_regalo
  for insert with check (
    public.user_is_evento_member(evento_id)
    and not public.user_is_evento_staff_centro(evento_id)
  );

create policy "aportes_regalo_update" on public.aportes_regalo
  for update using (
    public.user_is_evento_member(evento_id)
    and not public.user_is_evento_staff_centro(evento_id)
  );

create policy "aportes_regalo_delete" on public.aportes_regalo
  for delete using (
    public.user_is_evento_member(evento_id)
    and not public.user_is_evento_staff_centro(evento_id)
  );

-- 7) Acompañantes: solo admin/editor (no staff_centro) cuando el invitado es del evento
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
          or public.user_is_evento_editor_or_admin(i.evento_id)
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
          or public.user_is_evento_editor_or_admin(i.evento_id)
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
          or public.user_is_evento_editor_or_admin(i.evento_id)
        )
    )
  );

-- 8) insert_invitado_panel: bloquear staff_centro
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
    if exists (
      select 1 from public.evento_miembros m
      where m.evento_id = p_evento_id and m.user_id = auth.uid() and m.rol = 'staff_centro'
    ) then
      raise exception 'El personal del centro no puede crear invitados' using errcode = '42501';
    end if;
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

-- 9) sync acompañantes: excluir staff_centro en rama evento
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
          and public.user_is_evento_editor_or_admin(i.evento_id)
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

-- 10) RPC: resolver QR (solo columnas permitidas en JSON)
create or replace function public.staff_resolve_invitado_by_qr(p_evento_id uuid, p_qr text)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_row record;
  v_qr text;
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida' using errcode = '42501';
  end if;
  if not public.user_is_evento_staff_centro(p_evento_id) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  v_qr := trim(coalesce(p_qr, ''));
  if v_qr = '' then
    return jsonb_build_object('ok', false, 'error', 'qr_vacio');
  end if;

  select
    i.id,
    i.nombre_pasajero,
    i.asiento,
    i.restricciones_alimenticias,
    i.rsvp_estado,
    i.asistencia_confirmada
  into v_row
  from public.invitados i
  where i.evento_id = p_evento_id
    and (i.qr_code_token = v_qr or i.id::text = v_qr)
  limit 1;

  if v_row.id is null then
    return jsonb_build_object('ok', false, 'error', 'invitado_no_encontrado');
  end if;

  return jsonb_build_object(
    'ok', true,
    'invitado_id', v_row.id,
    'nombre_pasajero', v_row.nombre_pasajero,
    'asiento', v_row.asiento,
    'restricciones_alimenticias', coalesce(to_jsonb(v_row.restricciones_alimenticias), '[]'::jsonb),
    'rsvp_estado', v_row.rsvp_estado,
    'asistencia_confirmada', v_row.asistencia_confirmada
  );
end;
$$;

revoke all on function public.staff_resolve_invitado_by_qr(uuid, text) from public;
grant execute on function public.staff_resolve_invitado_by_qr(uuid, text) to authenticated;

-- 11) RPC: registrar entrada
create or replace function public.staff_set_asistencia_confirmada(p_invitado_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_evento uuid;
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida' using errcode = '42501';
  end if;

  select i.evento_id into v_evento
  from public.invitados i
  where i.id = p_invitado_id;

  if v_evento is null then
    return jsonb_build_object('ok', false, 'error', 'sin_evento');
  end if;

  if not public.user_is_evento_staff_centro(v_evento) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  update public.invitados
  set asistencia_confirmada = true
  where id = p_invitado_id and evento_id = v_evento;

  return jsonb_build_object('ok', true, 'invitado_id', p_invitado_id);
end;
$$;

revoke all on function public.staff_set_asistencia_confirmada(uuid) from public;
grant execute on function public.staff_set_asistencia_confirmada(uuid) to authenticated;

-- 12) Lista filtrable para staff
create or replace function public.staff_list_invitados_evento(
  p_evento_id uuid,
  p_asiento_q text default null,
  p_restriccion_q text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_asiento text;
  v_rest text;
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida' using errcode = '42501';
  end if;
  if not public.user_is_evento_staff_centro(p_evento_id) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  v_asiento := nullif(trim(p_asiento_q), '');
  v_rest := nullif(trim(p_restriccion_q), '');

  return coalesce(
    (
      select jsonb_agg(to_jsonb(sub))
      from (
        select
          i.id as invitado_id,
          i.nombre_pasajero,
          i.asiento,
          coalesce(to_jsonb(i.restricciones_alimenticias), '[]'::jsonb) as restricciones_alimenticias,
          i.rsvp_estado,
          i.asistencia_confirmada
        from public.invitados i
        where i.evento_id = p_evento_id
          and (v_asiento is null or i.asiento ilike '%' || v_asiento || '%')
          and (
            v_rest is null
            or (
              i.restricciones_alimenticias is not null
              and exists (
                select 1
                from unnest(coalesce(i.restricciones_alimenticias, array[]::text[])) as t(elem)
                where lower(elem) like '%' || lower(v_rest) || '%'
              )
            )
          )
        order by i.nombre_pasajero
      ) sub
    ),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.staff_list_invitados_evento(uuid, text, text) from public;
grant execute on function public.staff_list_invitados_evento(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
