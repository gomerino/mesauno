-- Ejecutar en el SQL Editor de Supabase (orden sugerido)

-- Parejas vinculadas a auth.users (novios)
create table if not exists public.parejas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade unique,
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
  created_at timestamptz default now()
);

-- Invitados al evento (pareja opcional; sin pareja se usa owner_user_id = auth.uid())
create table if not exists public.invitados (
  id uuid primary key default gen_random_uuid(),
  pareja_id uuid references public.parejas (id) on delete set null,
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

-- RLS (ajusta según tu política de seguridad)
alter table public.parejas enable row level security;
alter table public.invitados enable row level security;
alter table public.marketplace_servicios enable row level security;

-- Parejas: solo su fila
create policy "parejas_own" on public.parejas
  for all using (auth.uid() = user_id);

-- Invitados: lectura pública (landing /invitacion/[id])
create policy "invitados_select_public" on public.invitados
  for select using (true);

-- Invitados: insertar con pareja propia, o sin pareja si owner_user_id = quien crea el registro
drop policy if exists "invitados_insert_pareja" on public.invitados;
drop policy if exists "invitados_update_pareja" on public.invitados;
drop policy if exists "invitados_delete_pareja" on public.invitados;
drop policy if exists "invitados_insert_own" on public.invitados;
drop policy if exists "invitados_update_own" on public.invitados;
drop policy if exists "invitados_delete_own" on public.invitados;

-- INSERT: siempre owner_user_id = quien crea; pareja_id null o bien una pareja del mismo usuario
create policy "invitados_insert_own" on public.invitados
  for insert with check (
    owner_user_id = auth.uid()
    and (
      pareja_id is null
      or exists (
        select 1 from public.parejas p
        where p.id = pareja_id and p.user_id = auth.uid()
      )
    )
  );

-- UPDATE/DELETE: miembros de la pareja o el creador del registro
create policy "invitados_update_own" on public.invitados
  for update using (
    exists (select 1 from public.parejas p where p.id = pareja_id and p.user_id = auth.uid())
    or owner_user_id = auth.uid()
  );

create policy "invitados_delete_own" on public.invitados
  for delete using (
    exists (select 1 from public.parejas p where p.id = pareja_id and p.user_id = auth.uid())
    or owner_user_id = auth.uid()
  );

-- Acompañantes del invitado (varios por pase). `parejas` = novios; esto es +1, +2, etc.
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

-- RSVP desde invitados sin sesión: usar /api/rsvp con SUPABASE_SERVICE_ROLE_KEY (bypass RLS)

-- Marketplace: lectura pública
create policy "marketplace_read" on public.marketplace_servicios
  for select using (true);

-- Datos de ejemplo marketplace
insert into public.marketplace_servicios (nombre, descripcion, categoria, precio_desde, proveedor)
values
  ('Fotografía premium', 'Cobertura completa y álbum', 'fotografia', 1200, 'Studio Luz'),
  ('DJ & sonido', 'Equipo + playlist personalizada', 'musica', 800, 'SoundWave'),
  ('Catering vegano', 'Menú 3 tiempos', 'catering', 45, 'GreenFork'),
  ('Decoración floral', 'Centros y arco', 'decoracion', 900, 'Bloom Co.')
on conflict do nothing;

-- Si la tabla invitados ya existía sin owner_user_id, ejecuta:
-- alter table public.invitados add column if not exists owner_user_id uuid references auth.users (id) on delete set null;

-- Aportes / regalos en dinero (novios registran transferencias recibidas)
create table if not exists public.aportes_regalo (
  id uuid primary key default gen_random_uuid(),
  pareja_id uuid not null references public.parejas (id) on delete cascade,
  invitado_id uuid references public.invitados (id) on delete set null,
  monto numeric not null check (monto >= 0),
  concepto text,
  created_at timestamptz default now()
);

alter table public.aportes_regalo enable row level security;

create policy "aportes_regalo_select" on public.aportes_regalo
  for select using (
    exists (select 1 from public.parejas p where p.id = pareja_id and p.user_id = auth.uid())
  );

create policy "aportes_regalo_insert" on public.aportes_regalo
  for insert with check (
    exists (select 1 from public.parejas p where p.id = pareja_id and p.user_id = auth.uid())
  );

create policy "aportes_regalo_update" on public.aportes_regalo
  for update using (
    exists (select 1 from public.parejas p where p.id = pareja_id and p.user_id = auth.uid())
  );

create policy "aportes_regalo_delete" on public.aportes_regalo
  for delete using (
    exists (select 1 from public.parejas p where p.id = pareja_id and p.user_id = auth.uid())
  );
