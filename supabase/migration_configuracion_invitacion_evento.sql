-- Preferencias de invitación por evento (canal de envío previsto, regalos, copia del tema).
-- Ejecutar en Supabase SQL Editor o vía migración.

create table if not exists public.configuracion_invitacion_evento (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,

  estilo text,

  canal_envio text not null default 'ambos' check (
    canal_envio in ('correo', 'whatsapp', 'ambos')
  ),

  regalos_activos boolean not null default false,
  url_regalos text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint configuracion_invitacion_evento_evento_id_key unique (evento_id)
);

create index if not exists idx_configuracion_invitacion_evento_evento
  on public.configuracion_invitacion_evento (evento_id);

create or replace function public.trg_configuracion_invitacion_evento_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists configuracion_invitacion_evento_set_updated_at on public.configuracion_invitacion_evento;
create trigger configuracion_invitacion_evento_set_updated_at
  before update on public.configuracion_invitacion_evento
  for each row
  execute function public.trg_configuracion_invitacion_evento_set_updated_at();

comment on table public.configuracion_invitacion_evento is
  'Preferencias de la invitación del evento (canal previsto, regalos, estilo alineado con themes.id).';

-- Una fila por evento existente (estilo = theme actual del evento).
insert into public.configuracion_invitacion_evento (evento_id, estilo, canal_envio, regalos_activos, url_regalos)
select e.id, e.theme_id, 'ambos', false, null
from public.eventos e
where not exists (
  select 1 from public.configuracion_invitacion_evento c where c.evento_id = e.id
);

alter table public.configuracion_invitacion_evento enable row level security;

create policy "configuracion_invitacion_evento_select" on public.configuracion_invitacion_evento
  for select using (public.user_is_evento_member(evento_id));

create policy "configuracion_invitacion_evento_insert" on public.configuracion_invitacion_evento
  for insert with check (public.user_is_evento_editor_or_admin(evento_id));

create policy "configuracion_invitacion_evento_update" on public.configuracion_invitacion_evento
  for update using (public.user_is_evento_editor_or_admin(evento_id))
  with check (public.user_is_evento_editor_or_admin(evento_id));

create policy "configuracion_invitacion_evento_delete" on public.configuracion_invitacion_evento
  for delete using (public.user_is_evento_editor_or_admin(evento_id));
