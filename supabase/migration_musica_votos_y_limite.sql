-- Votos por aporte, límite de sugerencias y tabla de votos (servidor / service_role).
-- Idempotente.

alter table public.aportes_canciones
  add column if not exists votos int not null default 0;

comment on column public.aportes_canciones.votos is 'Contador de votos (sincronizado con inserts en votos_canciones).';

create table if not exists public.votos_canciones (
  id uuid primary key default gen_random_uuid(),
  aporte_id uuid not null references public.aportes_canciones (id) on delete cascade,
  usuario_id uuid references auth.users (id) on delete cascade,
  invitado_id uuid references public.invitados (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint votos_canciones_quien_chk check (
    (usuario_id is not null and invitado_id is null)
    or (usuario_id is null and invitado_id is not null)
  )
);

comment on table public.votos_canciones is 'Un voto por usuario o invitado por aporte; solo canciones aprobadas (validado en app).';

create unique index if not exists votos_canciones_aporte_usuario_key
  on public.votos_canciones (aporte_id, usuario_id)
  where usuario_id is not null;

create unique index if not exists votos_canciones_aporte_invitado_key
  on public.votos_canciones (aporte_id, invitado_id)
  where invitado_id is not null;

create index if not exists idx_votos_canciones_aporte on public.votos_canciones (aporte_id);

create or replace function public.incrementar_voto_aporte()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.aportes_canciones
  set votos = coalesce(votos, 0) + 1
  where id = new.aporte_id;
  return new;
end;
$$;

drop trigger if exists tr_votos_canciones_incrementar on public.votos_canciones;
create trigger tr_votos_canciones_incrementar
  after insert on public.votos_canciones
  for each row
  execute function public.incrementar_voto_aporte();

alter table public.votos_canciones enable row level security;

-- ROLLBACK:
-- drop trigger if exists tr_votos_canciones_incrementar on public.votos_canciones;
-- drop function if exists public.incrementar_voto_aporte();
-- drop table if exists public.votos_canciones;
-- alter table public.aportes_canciones drop column if exists votos;
