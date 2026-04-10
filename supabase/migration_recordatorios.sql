-- Recordatorios automáticos por evento (invitados pendientes de RSVP)

alter table public.eventos
  add column if not exists max_recordatorios int not null default 2
    check (max_recordatorios >= 1 and max_recordatorios <= 5);

alter table public.eventos
  add column if not exists frecuencia_recordatorios int not null default 3
    check (frecuencia_recordatorios >= 2 and frecuencia_recordatorios <= 14);

alter table public.eventos
  add column if not exists recordatorios_activos boolean not null default false;

alter table public.eventos
  add column if not exists fecha_inicio_recordatorios date;

comment on column public.eventos.fecha_inicio_recordatorios is 'Primer día (inclusive) en que pueden enviarse recordatorios. NULL = sin aplazamiento.';

alter table public.invitados
  add column if not exists conteo_recordatorios int not null default 0
    check (conteo_recordatorios >= 0);

alter table public.invitados
  add column if not exists ultimo_recordatorio_at timestamptz;

comment on column public.eventos.max_recordatorios is 'Máximo de correos de insistencia (no cuenta el envío inicial).';
comment on column public.eventos.frecuencia_recordatorios is 'Días mínimos entre insistencias.';
comment on column public.invitados.conteo_recordatorios is 'Cuántos recordatorios se han enviado ya a este invitado.';

create table if not exists public.log_recordatorios (
  id uuid primary key default gen_random_uuid(),
  invitado_id uuid not null references public.invitados (id) on delete cascade,
  evento_id uuid not null references public.eventos (id) on delete cascade,
  email_to text not null,
  asunto text,
  tipo text not null default 'recordatorio',
  exito boolean not null default true,
  mensaje_error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_log_recordatorios_evento on public.log_recordatorios (evento_id, created_at desc);
create index if not exists idx_log_recordatorios_invitado on public.log_recordatorios (invitado_id);

comment on table public.log_recordatorios is 'Auditoría de envíos de recordatorios (solo escritura vía service_role / cron).';

alter table public.log_recordatorios enable row level security;

-- Invitados elegibles en una sola consulta (usa el cron con service_role).
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
