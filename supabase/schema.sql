-- Ejecutar en el SQL Editor de Supabase (orden sugerido)
-- Modelo: evento + varios usuarios (evento_miembros). Invitados y aportes referencian evento_id.

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  nombre_novio_1 text,
  nombre_novio_2 text,
  fecha_boda date,
  nombre_evento text,
  fecha_evento date,
  destino text,
  codigo_vuelo text,
  hora_embarque text,
  puerta text,
  asiento_default text,
  motivo_viaje text,
  lugar_evento_linea text,
  plan_status text not null default 'trial' check (plan_status in ('trial', 'paid', 'expired')),
  payment_id text,
  monto_pagado numeric,
  max_recordatorios int not null default 2 check (max_recordatorios >= 1 and max_recordatorios <= 5),
  frecuencia_recordatorios int not null default 3 check (frecuencia_recordatorios >= 2 and frecuencia_recordatorios <= 14),
  recordatorios_activos boolean not null default false,
  fecha_inicio_recordatorios date,
  created_at timestamptz default now()
);

create table if not exists public.evento_miembros (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rol text not null default 'editor' check (rol in ('admin', 'editor', 'staff_centro')),
  created_at timestamptz default now(),
  unique (evento_id, user_id)
);

create index if not exists idx_evento_miembros_user on public.evento_miembros (user_id);
create index if not exists idx_evento_miembros_evento on public.evento_miembros (evento_id);

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

-- Comprobaciones de membresía sin recursión RLS (las políticas no pueden hacer SELECT en evento_miembros directamente).
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

grant execute on function public.user_is_evento_staff_centro(uuid) to authenticated;
grant execute on function public.user_is_evento_editor_or_admin(uuid) to authenticated;

-- Invitados al evento (evento opcional; sin evento se usa owner_user_id = auth.uid())
create table if not exists public.invitados (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references public.eventos (id) on delete set null,
  owner_user_id uuid references auth.users (id) on delete set null,
  nombre_pasajero text not null,
  email text,
  telefono text,
  restricciones_alimenticias text[],
  rsvp_estado text default 'pendiente' check (rsvp_estado in ('pendiente', 'confirmado', 'declinado')),
  codigo_vuelo text default 'DM7726',
  asiento text default '12A',
  puerta text default 'B',
  hora_embarque text default '17:30',
  destino text default 'Forever Island',
  nombre_evento text default 'Boda Dreams',
  fecha_evento date default (current_date + interval '30 days'),
  motivo_viaje text,
  nombre_acompanante text,
  email_enviado boolean not null default false,
  fecha_envio timestamptz,
  conteo_recordatorios int not null default 0 check (conteo_recordatorios >= 0),
  ultimo_recordatorio_at timestamptz,
  invitacion_vista boolean not null default false,
  fecha_ultima_vista timestamptz,
  token_acceso uuid not null default gen_random_uuid(),
  qr_code_token text not null,
  asistencia_confirmada boolean not null default false,
  created_at timestamptz default now()
);

-- Marketplace
create table if not exists public.marketplace_servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  categoria text not null,
  precio_desde numeric,
  imagen_url text,
  proveedor text,
  created_at timestamptz default now()
);

alter table public.eventos enable row level security;
alter table public.evento_miembros enable row level security;
alter table public.invitados enable row level security;
alter table public.marketplace_servicios enable row level security;

-- Invitados: el WITH CHECK del INSERT no puede depender de subconsultas a evento_miembros (falla a menudo).
-- Este trigger corre ANTES del RLS y valida membresía leyendo evento_miembros con row_security off.
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
  -- Sin JWT (SQL Editor, migraciones, RPC definer invocada como anon): no aplicar esta comprobación.
  -- RLS y el resto del trigger siguen protegiendo inserts con sesión real.
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

create unique index if not exists invitados_token_acceso_key on public.invitados (token_acceso);
create unique index if not exists invitados_qr_code_token_key on public.invitados (qr_code_token);

create or replace function public.trg_invitados_qr_token()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.qr_code_token is null or trim(new.qr_code_token) = '' then
    -- Sin depender de pgcrypto (gen_random_bytes); gen_random_uuid() viene en el core desde PG13.
    new.qr_code_token :=
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_invitados_qr_token on public.invitados;
create trigger trg_invitados_qr_token
  before insert on public.invitados
  for each row
  execute procedure public.trg_invitados_qr_token();

create or replace function public.mark_invitacion_vista(p_token text)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v uuid;
begin
  begin
    v := trim(p_token)::uuid;
  exception
    when invalid_text_representation then
      return;
  end;

  update public.invitados
  set invitacion_vista = true,
      fecha_ultima_vista = now()
  where id = v or token_acceso = v;
end;
$$;

revoke all on function public.mark_invitacion_vista(text) from public;
grant execute on function public.mark_invitacion_vista(text) to anon, authenticated;

-- Staff del venue: check-in sin columnas sensibles (validación en servidor / RPC).
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

create policy "eventos_select" on public.eventos
  for select using (public.user_is_evento_member(id));

create policy "eventos_insert" on public.eventos
  for insert with check (auth.uid() is not null);

create policy "eventos_update" on public.eventos
  for update using (public.user_is_evento_member(id))
  with check (public.user_is_evento_member(id));

create policy "eventos_delete" on public.eventos
  for delete using (public.user_is_evento_admin(id));

-- Cada usuario solo ve sus propias filas de membresía (sin función → sin dependencias raras en WITH CHECK).
create policy "evento_miembros_select" on public.evento_miembros
  for select using (user_id = auth.uid());

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

-- Invitados: lectura pública (landing /invitacion/[token] — id o token_acceso)
create policy "invitados_select_public" on public.invitados
  for select using (true);

drop policy if exists "invitados_insert_own" on public.invitados;
drop policy if exists "invitados_update_own" on public.invitados;
drop policy if exists "invitados_delete_own" on public.invitados;

-- INSERT: sin TO rol concreto; solo usuarios con uid en el JWT (anon sin login sigue sin poder insertar).
create policy "invitados_insert_own" on public.invitados
  for insert
  with check (
    auth.uid() is not null
    and (evento_id is null or not public.user_is_evento_staff_centro(evento_id))
  );

create policy "invitados_update_own" on public.invitados
  for update using (
    owner_user_id = auth.uid()
    or (
      public.user_is_evento_member(evento_id)
      and not public.user_is_evento_staff_centro(evento_id)
    )
  );

create policy "invitados_delete_own" on public.invitados
  for delete using (
    owner_user_id = auth.uid()
    or (
      public.user_is_evento_member(evento_id)
      and not public.user_is_evento_staff_centro(evento_id)
    )
  );

-- Alta desde el panel vía RPC: el INSERT no pasa por RLS del rol invocador (row_security off).
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

revoke all on function public.insert_invitado_panel(uuid, text, text, text, text, text[]) from public;
grant execute on function public.insert_invitado_panel(uuid, text, text, text, text, text[]) to authenticated;

-- Sincronizar acompañantes desde el panel (evita RLS en DELETE/INSERT directo sobre invitado_acompanantes).
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

revoke all on function public.sync_invitado_acompanantes_panel(uuid, text[]) from public;
grant execute on function public.sync_invitado_acompanantes_panel(uuid, text[]) to authenticated;

-- Acompañantes del invitado
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

create policy "invitado_acompanantes_select_public" on public.invitado_acompanantes
  for select using (true);

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

-- Marketplace: lectura pública
create policy "marketplace_read" on public.marketplace_servicios
  for select using (true);

insert into public.marketplace_servicios (nombre, descripcion, categoria, precio_desde, proveedor)
values
  ('Fotografía premium', 'Cobertura completa y álbum', 'fotografia', 1200, 'Studio Luz'),
  ('DJ & sonido', 'Equipo + playlist personalizada', 'musica', 800, 'SoundWave'),
  ('Catering vegano', 'Menú 3 tiempos', 'catering', 45, 'GreenFork'),
  ('Decoración floral', 'Centros y arco', 'decoracion', 900, 'Bloom Co.')
on conflict do nothing;

-- Aportes / regalos
create table if not exists public.aportes_regalo (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  invitado_id uuid references public.invitados (id) on delete set null,
  monto numeric not null check (monto >= 0),
  concepto text,
  created_at timestamptz default now()
);

alter table public.aportes_regalo enable row level security;

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

-- Programa del evento: tabla `evento_programa_hitos` + función `programa_evento_lista_publica` — migration_evento_programa.sql
-- Álbum de fotos: bucket `fotos_eventos`, tabla `evento_fotos`, RPC `fotos_evento_lista_publica` — migration_evento_fotos.sql
-- Temas de invitación UI: tabla `themes`, columna `invitados.theme_id` — migration_themes_invitados.sql

-- Spotify (música colaborativa): tablas `evento_spotify` y `playlist_aportes` — ejecutar también migration_spotify_music.sql
-- Recordatorios: `log_recordatorios`, función `invitados_elegibles_recordatorio` — ejecutar migration_recordatorios.sql
-- y si la BD ya existía antes: migration_recordatorios_fecha_inicio.sql (fecha_inicio_recordatorios + función).
