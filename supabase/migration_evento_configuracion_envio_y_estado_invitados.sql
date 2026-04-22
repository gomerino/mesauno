-- Configuración de envío a nivel evento + estado de invitación por invitado.
-- Los invitados del evento viven en public.invitados (referencia de producto: evento_invitados).

-- 1) Tabla evento_configuracion_envio
create table if not exists public.evento_configuracion_envio (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  canal_envio_preferido text not null default 'ambos' check (
    canal_envio_preferido in ('correo', 'whatsapp', 'ambos')
  ),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint evento_configuracion_envio_evento_id_key unique (evento_id)
);

create index if not exists idx_evento_config_envio_evento
  on public.evento_configuracion_envio (evento_id);

create or replace function public.trg_evento_configuracion_envio_set_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

drop trigger if exists evento_configuracion_envio_set_actualizado_en on public.evento_configuracion_envio;
create trigger evento_configuracion_envio_set_actualizado_en
  before update on public.evento_configuracion_envio
  for each row
  execute function public.trg_evento_configuracion_envio_set_actualizado_en();

insert into public.evento_configuracion_envio (evento_id, canal_envio_preferido)
select e.id, 'ambos'
from public.eventos e
where not exists (
  select 1 from public.evento_configuracion_envio c where c.evento_id = e.id
);

alter table public.evento_configuracion_envio enable row level security;

create policy "evento_configuracion_envio_select" on public.evento_configuracion_envio
  for select using (public.user_is_evento_member(evento_id));

create policy "evento_configuracion_envio_insert" on public.evento_configuracion_envio
  for insert with check (public.user_is_evento_editor_or_admin(evento_id));

create policy "evento_configuracion_envio_update" on public.evento_configuracion_envio
  for update using (public.user_is_evento_editor_or_admin(evento_id))
  with check (public.user_is_evento_editor_or_admin(evento_id));

create policy "evento_configuracion_envio_delete" on public.evento_configuracion_envio
  for delete using (public.user_is_evento_editor_or_admin(evento_id));

-- 2) Columnas en invitados (invitados del evento)
alter table public.invitados add column if not exists canal_envio text
  check (canal_envio is null or canal_envio in ('correo', 'whatsapp', 'ambos'));

alter table public.invitados add column if not exists estado_envio text not null default 'pendiente'
  check (estado_envio in ('pendiente', 'enviado', 'abierto', 'confirmado'));

alter table public.invitados add column if not exists fecha_apertura timestamptz;

alter table public.invitados add column if not exists fecha_confirmacion timestamptz;

-- Backfill estado_envio desde datos existentes (no borra columnas legacy).
update public.invitados i
set
  estado_envio = case
    when i.rsvp_estado = 'confirmado' then 'confirmado'
    when coalesce(i.invitacion_vista, false) and coalesce(i.email_enviado, false) then 'abierto'
    when coalesce(i.email_enviado, false) then 'enviado'
    else 'pendiente'
  end,
  fecha_apertura = coalesce(i.fecha_apertura, i.fecha_ultima_vista),
  fecha_confirmacion = case
    when i.rsvp_estado = 'confirmado' then coalesce(i.fecha_confirmacion, i.created_at)
    else i.fecha_confirmacion
  end
where true;

comment on column public.invitados.estado_envio is
  'Estado del flujo de invitación: pendiente → enviado → abierto; confirmado al confirmar asistencia (RSVP).';
comment on column public.invitados.canal_envio is
  'Último canal usado o previsto para el envío (correo / WhatsApp / ambos).';
