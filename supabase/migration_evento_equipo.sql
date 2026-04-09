-- Gestión de equipo: listado con email (auth.users), altas/bajas solo admin, claim de invitación por metadata.

create or replace function public.user_is_evento_dashboard_member(p_evento_id uuid)
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

grant execute on function public.user_is_evento_dashboard_member(uuid) to authenticated;

-- Lista miembros + email (solo admin o editor del evento).
create or replace function public.evento_equipo_list(p_evento_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida' using errcode = '42501';
  end if;
  if not public.user_is_evento_dashboard_member(p_evento_id) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  return coalesce(
    (
      select jsonb_agg(to_jsonb(t))
      from (
        select
          m.user_id,
          m.rol,
          m.created_at,
          u.email::text as email
        from public.evento_miembros m
        join auth.users u on u.id = m.user_id
        where m.evento_id = p_evento_id
        order by m.rol, u.email
      ) t
    ),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.evento_equipo_list(uuid) from public;
grant execute on function public.evento_equipo_list(uuid) to authenticated;

-- Eliminar miembro (solo admin; no eliminar al único admin).
create or replace function public.evento_equipo_remove_member(p_evento_id uuid, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  target_rol text;
  admin_count int;
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida' using errcode = '42501';
  end if;
  if not public.user_is_evento_admin(p_evento_id) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  select m.rol into target_rol
  from public.evento_miembros m
  where m.evento_id = p_evento_id and m.user_id = p_user_id;

  if target_rol is null then
    return jsonb_build_object('ok', false, 'error', 'no_miembro');
  end if;

  if target_rol = 'admin' then
    select count(*)::int into admin_count
    from public.evento_miembros
    where evento_id = p_evento_id and rol = 'admin';
    if admin_count <= 1 then
      return jsonb_build_object('ok', false, 'error', 'unico_admin');
    end if;
  end if;

  delete from public.evento_miembros
  where evento_id = p_evento_id and user_id = p_user_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.evento_equipo_remove_member(uuid, uuid) from public;
grant execute on function public.evento_equipo_remove_member(uuid, uuid) to authenticated;

-- Añadir miembro si el usuario ya existe (solo admin).
create or replace function public.evento_add_member_existing_user(
  p_evento_id uuid,
  p_email text,
  p_rol text
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  uid uuid;
  norm_email text;
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida' using errcode = '42501';
  end if;
  if not public.user_is_evento_admin(p_evento_id) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if p_rol is null or p_rol not in ('admin', 'editor', 'staff_centro') then
    return jsonb_build_object('ok', false, 'error', 'rol_invalido');
  end if;

  norm_email := lower(trim(p_email));
  if norm_email = '' then
    return jsonb_build_object('ok', false, 'error', 'email_vacio');
  end if;

  select u.id into uid
  from auth.users u
  where lower(u.email::text) = norm_email
  limit 1;

  if uid is null then
    return jsonb_build_object('ok', false, 'status', 'user_not_found');
  end if;

  if exists (
    select 1 from public.evento_miembros m
    where m.evento_id = p_evento_id and m.user_id = uid
  ) then
    return jsonb_build_object('ok', false, 'error', 'ya_miembro');
  end if;

  insert into public.evento_miembros (evento_id, user_id, rol)
  values (p_evento_id, uid, p_rol);

  return jsonb_build_object('ok', true, 'user_id', uid);
end;
$$;

revoke all on function public.evento_add_member_existing_user(uuid, text, text) from public;
grant execute on function public.evento_add_member_existing_user(uuid, text, text) to authenticated;

-- Tras invitación: crear fila en evento_miembros desde user_metadata (JWT).
create or replace function public.evento_claim_invite_from_metadata()
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  meta jsonb;
  eid uuid;
  r text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'sin_sesion');
  end if;

  meta := coalesce(
    (select raw_user_meta_data from auth.users where id = auth.uid()),
    '{}'::jsonb
  );

  eid := (meta->>'invited_evento_id')::uuid;
  r := meta->>'invited_rol';

  if eid is null or r is null then
    return jsonb_build_object('ok', false, 'status', 'sin_invitacion');
  end if;

  if r not in ('admin', 'editor', 'staff_centro') then
    return jsonb_build_object('ok', false, 'error', 'rol_invalido');
  end if;

  insert into public.evento_miembros (evento_id, user_id, rol)
  values (eid, auth.uid(), r)
  on conflict (evento_id, user_id) do update set rol = excluded.rol;

  return jsonb_build_object('ok', true, 'evento_id', eid, 'rol', r);
end;
$$;

revoke all on function public.evento_claim_invite_from_metadata() from public;
grant execute on function public.evento_claim_invite_from_metadata() to authenticated;

notify pgrst, 'reload schema';
