-- Modo fiesta en vivo: cola, votos temporales y flags en aportes (servidor / service_role).
-- Idempotente.

alter table public.playlists_evento
  add column if not exists modo_fiesta_activo boolean not null default false;

comment on column public.playlists_evento.modo_fiesta_activo is 'Si true, invitados usan votación en vivo y cola dinámica.';

alter table public.aportes_canciones
  add column if not exists en_cola boolean not null default false,
  add column if not exists orden_cola int,
  add column if not exists reproducida boolean not null default false,
  add column if not exists votos_live int not null default 0;

comment on column public.aportes_canciones.en_cola is 'Pertenece al top 10 de cola activa (modo fiesta).';
comment on column public.aportes_canciones.orden_cola is 'Posición en cola (1 = primer tema de la cola).';
comment on column public.aportes_canciones.reproducida is 'Marcada como ya pasada en la fiesta (modo novios).';
comment on column public.aportes_canciones.votos_live is 'Votos modo fiesta (tabla votos_en_vivo); no altera votos histórico.';

create table if not exists public.votos_en_vivo (
  id uuid primary key default gen_random_uuid(),
  aporte_id uuid not null references public.aportes_canciones (id) on delete cascade,
  usuario_id uuid references auth.users (id) on delete cascade,
  invitado_id uuid references public.invitados (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint votos_en_vivo_quien_chk check (
    (usuario_id is not null and invitado_id is null)
    or (usuario_id is null and invitado_id is not null)
  )
);

comment on table public.votos_en_vivo is 'Voto puntual en modo fiesta (no modifica votos históricos de votos_canciones).';

create unique index if not exists votos_en_vivo_aporte_usuario_key
  on public.votos_en_vivo (aporte_id, usuario_id)
  where usuario_id is not null;

create unique index if not exists votos_en_vivo_aporte_invitado_key
  on public.votos_en_vivo (aporte_id, invitado_id)
  where invitado_id is not null;

create index if not exists idx_votos_en_vivo_aporte on public.votos_en_vivo (aporte_id);

create or replace function public.incrementar_voto_live_aporte()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.aportes_canciones
  set votos_live = coalesce(votos_live, 0) + 1
  where id = new.aporte_id;
  return new;
end;
$$;

drop trigger if exists tr_votos_en_vivo_incrementar on public.votos_en_vivo;
create trigger tr_votos_en_vivo_incrementar
  after insert on public.votos_en_vivo
  for each row
  execute function public.incrementar_voto_live_aporte();

alter table public.votos_en_vivo enable row level security;

-- Lectura para miembros autenticados (Realtime en panel). Escritura solo API service_role.
drop policy if exists votos_en_vivo_select_miembros on public.votos_en_vivo;
create policy votos_en_vivo_select_miembros on public.votos_en_vivo
  for select to authenticated
  using (
    exists (
      select 1
      from public.aportes_canciones a
      inner join public.evento_miembros m on m.evento_id = a.evento_id and m.user_id = auth.uid()
      where a.id = votos_en_vivo.aporte_id
    )
  );

drop policy if exists aportes_canciones_select_miembros on public.aportes_canciones;
create policy aportes_canciones_select_miembros on public.aportes_canciones
  for select to authenticated
  using (
    exists (
      select 1 from public.evento_miembros m
      where m.evento_id = aportes_canciones.evento_id and m.user_id = auth.uid()
    )
  );

-- Realtime: en Supabase → Database → Publications → supabase_realtime, agregar si aplica:
--   public.votos_en_vivo, public.aportes_canciones

-- ROLLBACK:
-- drop policy if exists votos_en_vivo_select_miembros on public.votos_en_vivo;
-- drop policy if exists aportes_canciones_select_miembros on public.aportes_canciones;
-- drop trigger if exists tr_votos_en_vivo_incrementar on public.votos_en_vivo;
-- drop function if exists public.incrementar_voto_live_aporte();
-- drop table if exists public.votos_en_vivo;
-- alter table public.aportes_canciones drop column if exists votos_live;
-- alter table public.aportes_canciones drop column if exists reproducida;
-- alter table public.aportes_canciones drop column if exists orden_cola;
-- alter table public.aportes_canciones drop column if exists en_cola;
-- alter table public.playlists_evento drop column if exists modo_fiesta_activo;
