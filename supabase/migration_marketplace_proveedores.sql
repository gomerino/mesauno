-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║  Marketplace proveedores — M01 (JUR-36)                                   ║
-- ║  Workflow: workflows/M01-providers-schema/                                ║
-- ╠════════════════════════════════════════════════════════════════════════════╣
-- ║  Introduce el modelo relacional real para el marketplace:                 ║
-- ║    · proveedores             (perfil del proveedor)                       ║
-- ║    · proveedor_servicios     (catálogo bookable)                          ║
-- ║    · proveedor_medios        (fotos / videos)                             ║
-- ║    · proveedor_solicitudes   (solicitudes novio → proveedor, "leads")     ║
-- ║    · proveedor_favoritos     ("agregar proveedor a mi evento", wishlist)  ║
-- ║  + storage bucket `proveedor-medios` (público lectura)                    ║
-- ║  + RLS policies por tabla                                                 ║
-- ║  + triggers: updated_at en proveedores; bump solicitudes_mes on insert    ║
-- ║                                                                            ║
-- ║  La tabla legacy public.marketplace_servicios NO se borra en esta         ║
-- ║  migración; se marca DEPRECATED via comment. Borrado en ticket aparte.    ║
-- ║                                                                            ║
-- ║  Convenciones: tablas/columnas en español (patrón del resto del schema    ║
-- ║  del repo). Enum values: `pendiente/aprobado/suspendido`, `imagen/video`, ║
-- ║  `en_app/email/whatsapp`. Valores técnicos (`free/premium`, códigos de    ║
-- ║  rango_presupuesto como `lt-500k`) se mantienen en inglés.                ║
-- ║                                                                            ║
-- ║  Rollback al final del archivo (comentado).                               ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- ─── Tablas ─────────────────────────────────────────────────────────────────

create table if not exists public.proveedores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text not null,
  nombre_negocio text not null,
  eslogan text,
  biografia text,
  region text not null,
  ciudad text,
  categoria_principal text not null,
  telefono text,
  email text,
  sitio_web text,
  instagram text,
  whatsapp text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aprobado', 'suspendido')),
  motivo_suspension text,
  plan text not null default 'free'
    check (plan in ('free', 'premium')),
  plan_inicio_at timestamptz,
  solicitudes_mes int not null default 0 check (solicitudes_mes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proveedores_user_unique unique (user_id),
  constraint proveedores_slug_unique unique (slug)
);

create index if not exists idx_proveedores_estado_categoria
  on public.proveedores (estado, categoria_principal);
create index if not exists idx_proveedores_region
  on public.proveedores (region);

comment on table public.proveedores is
  'Perfil de proveedor del marketplace. 1:1 con auth.users. Lectura pública solo si estado=aprobado.';
comment on column public.proveedores.solicitudes_mes is
  'Contador reseteado mensualmente por job externo. No confundir con count(*) de proveedor_solicitudes.';


create table if not exists public.proveedor_servicios (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.proveedores (id) on delete cascade,
  nombre text not null,
  descripcion text,
  categoria text not null,
  precio_desde_clp numeric check (precio_desde_clp is null or precio_desde_clp >= 0),
  duracion_min int check (duracion_min is null or duracion_min >= 0),
  activo boolean not null default true,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_proveedor_servicios_proveedor
  on public.proveedor_servicios (proveedor_id, orden);


create table if not exists public.proveedor_medios (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.proveedores (id) on delete cascade,
  servicio_id uuid references public.proveedor_servicios (id) on delete set null,
  tipo text not null check (tipo in ('imagen', 'video')),
  storage_path text not null,
  url_publica text not null,
  alt text,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  constraint proveedor_medios_storage_path_unique unique (storage_path)
);

create index if not exists idx_proveedor_medios_proveedor
  on public.proveedor_medios (proveedor_id, orden);


create table if not exists public.proveedor_solicitudes (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.proveedores (id) on delete cascade,
  evento_id uuid references public.eventos (id) on delete set null,
  remitente_user_id uuid references auth.users (id) on delete set null,
  canal text not null check (canal in ('whatsapp', 'email', 'en_app')),
  mensaje text,
  fecha_evento_contexto text,
  region_contexto text,
  presupuesto_clp_contexto numeric check (presupuesto_clp_contexto is null or presupuesto_clp_contexto >= 0),
  rango_presupuesto text check (rango_presupuesto is null or rango_presupuesto in ('lt-500k', '500k-1m', '1m-3m', 'gt-3m')),
  limitado_por_plan boolean not null default false,
  dia_solicitud date not null default ((now() at time zone 'utc')::date),
  created_at timestamptz not null default now(),
  constraint proveedor_solicitudes_unica_por_dia
    unique (proveedor_id, remitente_user_id, canal, dia_solicitud)
);

create index if not exists idx_proveedor_solicitudes_proveedor_created
  on public.proveedor_solicitudes (proveedor_id, created_at desc);
create index if not exists idx_proveedor_solicitudes_remitente
  on public.proveedor_solicitudes (remitente_user_id, dia_solicitud);

comment on column public.proveedor_solicitudes.limitado_por_plan is
  'true cuando al momento del insert el proveedor estaba free y ya tenía solicitudes_mes >= cap. El proveedor NO recibe email cuando está limitado.';


create table if not exists public.proveedor_favoritos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  proveedor_id uuid not null references public.proveedores (id) on delete cascade,
  servicio_id uuid references public.proveedor_servicios (id) on delete set null,
  agregado_por uuid not null references auth.users (id) on delete cascade,
  nota text,
  created_at timestamptz not null default now()
);

-- UNIQUE NULL-safe (Postgres trata NULLs como distintos en UNIQUE normal):
-- COALESCE con UUID sentinel para que (evento, proveedor, NULL) sea único.
create unique index if not exists proveedor_favoritos_unique_item
  on public.proveedor_favoritos (
    evento_id,
    proveedor_id,
    coalesce(servicio_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists idx_proveedor_favoritos_evento
  on public.proveedor_favoritos (evento_id, created_at desc);


-- ─── Helpers RLS (sin recursión) ────────────────────────────────────────────

create or replace function public.user_is_proveedor_owner(p_proveedor_id uuid)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
stable
as $$
  select exists (
    select 1 from public.proveedores p
    where p.id = p_proveedor_id and p.user_id = auth.uid()
  );
$$;

grant execute on function public.user_is_proveedor_owner(uuid) to authenticated;


create or replace function public.proveedor_es_visible(p_proveedor_id uuid)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
stable
as $$
  select exists (
    select 1 from public.proveedores p
    where p.id = p_proveedor_id and p.estado = 'aprobado'
  );
$$;

grant execute on function public.proveedor_es_visible(uuid) to anon, authenticated;


-- ─── Triggers ───────────────────────────────────────────────────────────────

create or replace function public.trg_proveedores_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists proveedores_set_updated_at on public.proveedores;
create trigger proveedores_set_updated_at
  before update on public.proveedores
  for each row
  execute procedure public.trg_proveedores_set_updated_at();


-- Incremento del contador solicitudes_mes al insertar una solicitud.
-- Corre con row_security off: el proveedor destinatario no tiene policy UPDATE
-- directa desde un INSERT hecho por otro user.
create or replace function public.trg_proveedor_solicitudes_bump_counter()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  update public.proveedores
  set solicitudes_mes = solicitudes_mes + 1
  where id = new.proveedor_id;
  return new;
end;
$$;

drop trigger if exists proveedor_solicitudes_bump_counter on public.proveedor_solicitudes;
create trigger proveedor_solicitudes_bump_counter
  after insert on public.proveedor_solicitudes
  for each row
  execute procedure public.trg_proveedor_solicitudes_bump_counter();


-- ─── RLS ────────────────────────────────────────────────────────────────────

alter table public.proveedores            enable row level security;
alter table public.proveedor_servicios    enable row level security;
alter table public.proveedor_medios       enable row level security;
alter table public.proveedor_solicitudes  enable row level security;
alter table public.proveedor_favoritos    enable row level security;


-- proveedores ─────────────────────────────────────────────
drop policy if exists "proveedores_select_aprobados" on public.proveedores;
drop policy if exists "proveedores_select_owner"     on public.proveedores;
drop policy if exists "proveedores_insert_self"      on public.proveedores;
drop policy if exists "proveedores_update_owner"     on public.proveedores;
drop policy if exists "proveedores_delete_owner"     on public.proveedores;

-- Lectura pública: solo aprobados.
create policy "proveedores_select_aprobados" on public.proveedores
  for select using (estado = 'aprobado');

-- Lectura del owner: ve su propio perfil en cualquier estado.
create policy "proveedores_select_owner" on public.proveedores
  for select using (user_id = auth.uid());

-- Insert: user autenticado creando SU propio proveedor.
create policy "proveedores_insert_self" on public.proveedores
  for insert with check (auth.uid() is not null and user_id = auth.uid());

create policy "proveedores_update_owner" on public.proveedores
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "proveedores_delete_owner" on public.proveedores
  for delete using (user_id = auth.uid());


-- proveedor_servicios ─────────────────────────────────────
drop policy if exists "proveedor_servicios_select_publico" on public.proveedor_servicios;
drop policy if exists "proveedor_servicios_select_owner"   on public.proveedor_servicios;
drop policy if exists "proveedor_servicios_insert_owner"   on public.proveedor_servicios;
drop policy if exists "proveedor_servicios_update_owner"   on public.proveedor_servicios;
drop policy if exists "proveedor_servicios_delete_owner"   on public.proveedor_servicios;

-- Público: solo si el proveedor padre está aprobado.
create policy "proveedor_servicios_select_publico" on public.proveedor_servicios
  for select using (public.proveedor_es_visible(proveedor_id));

-- Owner: ve todos sus servicios.
create policy "proveedor_servicios_select_owner" on public.proveedor_servicios
  for select using (public.user_is_proveedor_owner(proveedor_id));

create policy "proveedor_servicios_insert_owner" on public.proveedor_servicios
  for insert with check (public.user_is_proveedor_owner(proveedor_id));

create policy "proveedor_servicios_update_owner" on public.proveedor_servicios
  for update using (public.user_is_proveedor_owner(proveedor_id))
  with check (public.user_is_proveedor_owner(proveedor_id));

create policy "proveedor_servicios_delete_owner" on public.proveedor_servicios
  for delete using (public.user_is_proveedor_owner(proveedor_id));


-- proveedor_medios ────────────────────────────────────────
drop policy if exists "proveedor_medios_select_publico" on public.proveedor_medios;
drop policy if exists "proveedor_medios_select_owner"   on public.proveedor_medios;
drop policy if exists "proveedor_medios_insert_owner"   on public.proveedor_medios;
drop policy if exists "proveedor_medios_update_owner"   on public.proveedor_medios;
drop policy if exists "proveedor_medios_delete_owner"   on public.proveedor_medios;

create policy "proveedor_medios_select_publico" on public.proveedor_medios
  for select using (public.proveedor_es_visible(proveedor_id));

create policy "proveedor_medios_select_owner" on public.proveedor_medios
  for select using (public.user_is_proveedor_owner(proveedor_id));

create policy "proveedor_medios_insert_owner" on public.proveedor_medios
  for insert with check (public.user_is_proveedor_owner(proveedor_id));

create policy "proveedor_medios_update_owner" on public.proveedor_medios
  for update using (public.user_is_proveedor_owner(proveedor_id))
  with check (public.user_is_proveedor_owner(proveedor_id));

create policy "proveedor_medios_delete_owner" on public.proveedor_medios
  for delete using (public.user_is_proveedor_owner(proveedor_id));


-- proveedor_solicitudes ───────────────────────────────────
drop policy if exists "proveedor_solicitudes_select_remitente" on public.proveedor_solicitudes;
drop policy if exists "proveedor_solicitudes_select_owner"     on public.proveedor_solicitudes;
drop policy if exists "proveedor_solicitudes_insert_remitente" on public.proveedor_solicitudes;
drop policy if exists "proveedor_solicitudes_update_owner"     on public.proveedor_solicitudes;
drop policy if exists "proveedor_solicitudes_delete_owner"     on public.proveedor_solicitudes;

-- SELECT: el novio remitente ve su solicitud; el proveedor destinatario también.
create policy "proveedor_solicitudes_select_remitente" on public.proveedor_solicitudes
  for select using (remitente_user_id = auth.uid());

create policy "proveedor_solicitudes_select_owner" on public.proveedor_solicitudes
  for select using (public.user_is_proveedor_owner(proveedor_id));

-- INSERT: cualquier auth user puede crear solicitud si remitente = él mismo y
-- el proveedor está visible. El rate limit global + `limitado_por_plan` se
-- aplican en la capa API (fuera de M01).
create policy "proveedor_solicitudes_insert_remitente" on public.proveedor_solicitudes
  for insert with check (
    auth.uid() is not null
    and remitente_user_id = auth.uid()
    and public.proveedor_es_visible(proveedor_id)
  );

-- UPDATE/DELETE del proveedor destinatario (marcar respondida, limpiar spam).
create policy "proveedor_solicitudes_update_owner" on public.proveedor_solicitudes
  for update using (public.user_is_proveedor_owner(proveedor_id))
  with check (public.user_is_proveedor_owner(proveedor_id));

create policy "proveedor_solicitudes_delete_owner" on public.proveedor_solicitudes
  for delete using (public.user_is_proveedor_owner(proveedor_id));


-- proveedor_favoritos ─────────────────────────────────────
drop policy if exists "proveedor_favoritos_select" on public.proveedor_favoritos;
drop policy if exists "proveedor_favoritos_insert" on public.proveedor_favoritos;
drop policy if exists "proveedor_favoritos_update" on public.proveedor_favoritos;
drop policy if exists "proveedor_favoritos_delete" on public.proveedor_favoritos;

create policy "proveedor_favoritos_select" on public.proveedor_favoritos
  for select using (
    public.user_is_evento_member(evento_id)
    and not public.user_is_evento_staff_centro(evento_id)
  );

create policy "proveedor_favoritos_insert" on public.proveedor_favoritos
  for insert with check (
    auth.uid() is not null
    and agregado_por = auth.uid()
    and public.user_is_evento_member(evento_id)
    and not public.user_is_evento_staff_centro(evento_id)
    and public.proveedor_es_visible(proveedor_id)
  );

create policy "proveedor_favoritos_update" on public.proveedor_favoritos
  for update using (
    public.user_is_evento_member(evento_id)
    and not public.user_is_evento_staff_centro(evento_id)
  );

create policy "proveedor_favoritos_delete" on public.proveedor_favoritos
  for delete using (
    public.user_is_evento_member(evento_id)
    and not public.user_is_evento_staff_centro(evento_id)
  );


-- ─── Storage bucket ─────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proveedor-medios',
  'proveedor-medios',
  true,
  12582912,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "proveedor_medios_public_read"  on storage.objects;
drop policy if exists "proveedor_medios_write_auth"   on storage.objects;
drop policy if exists "proveedor_medios_update_auth"  on storage.objects;
drop policy if exists "proveedor_medios_delete_auth"  on storage.objects;

-- Lectura pública (URLs difundibles en cards del marketplace).
create policy "proveedor_medios_public_read" on storage.objects
  for select using (bucket_id = 'proveedor-medios');

-- Subida: cualquier user autenticado puede subir en el path `<proveedor_id>/*`.
-- La validación de que `<proveedor_id>` pertenece al auth.uid() vive en la
-- capa API (antes de subir). Sin esta policy no pueden subir ni siquiera
-- los legítimos.
create policy "proveedor_medios_write_auth" on storage.objects
  for insert with check (
    bucket_id = 'proveedor-medios'
    and auth.role() = 'authenticated'
  );

create policy "proveedor_medios_update_auth" on storage.objects
  for update using (
    bucket_id = 'proveedor-medios'
    and auth.role() = 'authenticated'
  );

create policy "proveedor_medios_delete_auth" on storage.objects
  for delete using (
    bucket_id = 'proveedor-medios'
    and auth.role() = 'authenticated'
  );


-- ─── Vista para el listado ──────────────────────────────────────────────────
--
-- Consolida proveedor + imagen hero + precio desde del servicio más barato
-- activo. Pensada para /marketplace (M04). Se refresca on-the-fly (no
-- materializada) porque el volumen MVP no lo justifica.

create or replace view public.v_marketplace_tarjetas as
select
  p.id,
  p.slug,
  p.nombre_negocio,
  p.eslogan,
  p.categoria_principal,
  p.region,
  p.ciudad,
  p.plan,
  p.estado,
  p.created_at,
  p.solicitudes_mes,
  (
    select pm.url_publica
    from public.proveedor_medios pm
    where pm.proveedor_id = p.id
    order by pm.orden asc, pm.created_at asc
    limit 1
  ) as imagen_hero_url,
  (
    select min(ps.precio_desde_clp)
    from public.proveedor_servicios ps
    where ps.proveedor_id = p.id
      and ps.activo = true
      and ps.precio_desde_clp is not null
  ) as precio_desde_clp,
  (
    select count(*)
    from public.proveedor_medios pm
    where pm.proveedor_id = p.id
  )::int as medios_count
from public.proveedores p
where p.estado = 'aprobado';

grant select on public.v_marketplace_tarjetas to anon, authenticated;


-- ─── Deprecación de la tabla legacy ─────────────────────────────────────────

comment on table public.marketplace_servicios is
  'DEPRECATED — reemplazada por proveedores + proveedor_servicios (M01, JUR-36). '
  'Se mantiene solo durante la transición; eliminar en ticket separado tras 30 días.';


-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║                              ROLLBACK                                      ║
-- ╠════════════════════════════════════════════════════════════════════════════╣
-- ║  Ejecutar en orden inverso si hay que revertir. Descomentar bloque.       ║
-- ║                                                                            ║
-- ║  -- drop view if exists public.v_marketplace_tarjetas;                     ║
-- ║                                                                            ║
-- ║  -- drop policy if exists "proveedor_medios_delete_auth"  on storage.objects;║
-- ║  -- drop policy if exists "proveedor_medios_update_auth"  on storage.objects;║
-- ║  -- drop policy if exists "proveedor_medios_write_auth"   on storage.objects;║
-- ║  -- drop policy if exists "proveedor_medios_public_read"  on storage.objects;║
-- ║  -- delete from storage.buckets where id = 'proveedor-medios';             ║
-- ║                                                                            ║
-- ║  -- drop table if exists public.proveedor_favoritos;                       ║
-- ║  -- drop table if exists public.proveedor_solicitudes;                     ║
-- ║  -- drop table if exists public.proveedor_medios;                          ║
-- ║  -- drop table if exists public.proveedor_servicios;                       ║
-- ║  -- drop table if exists public.proveedores;                               ║
-- ║                                                                            ║
-- ║  -- drop function if exists public.trg_proveedor_solicitudes_bump_counter();║
-- ║  -- drop function if exists public.trg_proveedores_set_updated_at();       ║
-- ║  -- drop function if exists public.proveedor_es_visible(uuid);             ║
-- ║  -- drop function if exists public.user_is_proveedor_owner(uuid);          ║
-- ║                                                                            ║
-- ║  -- comment on table public.marketplace_servicios is null;                 ║
-- ╚════════════════════════════════════════════════════════════════════════════╝
