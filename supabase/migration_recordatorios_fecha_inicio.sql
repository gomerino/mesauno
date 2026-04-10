-- Fecha desde la cual el cron puede enviar recordatorios (además de recordatorios_activos y cadencia).

alter table public.eventos
  add column if not exists fecha_inicio_recordatorios date;

comment on column public.eventos.fecha_inicio_recordatorios is 'Primer día (inclusive) en que pueden enviarse recordatorios. NULL = sin aplazamiento.';

create or replace function public.invitados_elegibles_recordatorio()
returns table (
  invitado_id uuid,
  evento_id uuid,
  email text,
  nombre_pasajero text,
  token_acceso uuid,
  conteo_recordatorios int,
  fecha_envio timestamptz,
  ultimo_recordatorio_at timestamptz,
  max_recordatorios int,
  frecuencia_recordatorios int,
  nombre_novio_1 text,
  nombre_novio_2 text
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    i.id,
    i.evento_id,
    i.email,
    i.nombre_pasajero,
    i.token_acceso,
    i.conteo_recordatorios,
    i.fecha_envio,
    i.ultimo_recordatorio_at,
    e.max_recordatorios,
    e.frecuencia_recordatorios,
    e.nombre_novio_1,
    e.nombre_novio_2
  from public.invitados i
  inner join public.eventos e on e.id = i.evento_id
  where i.evento_id is not null
    and e.recordatorios_activos = true
    and (e.fecha_inicio_recordatorios is null or e.fecha_inicio_recordatorios <= current_date)
    and i.rsvp_estado = 'pendiente'
    and i.email is not null
    and btrim(i.email) <> ''
    and i.email_enviado = true
    and i.fecha_envio is not null
    and i.conteo_recordatorios < e.max_recordatorios
    and (
      (
        i.conteo_recordatorios = 0
        and now() >= i.fecha_envio + (e.frecuencia_recordatorios * interval '1 day')
      )
      or (
        i.conteo_recordatorios > 0
        and i.ultimo_recordatorio_at is not null
        and now() >= i.ultimo_recordatorio_at + (e.frecuencia_recordatorios * interval '1 day')
      )
    );
$$;

revoke all on function public.invitados_elegibles_recordatorio() from public;
grant execute on function public.invitados_elegibles_recordatorio() to service_role;
