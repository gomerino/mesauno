-- Columnas esperadas por la app (idempotente).
-- El nombre del invitado en BD es nombre_pasajero (boarding pass).

-- Tras migrar parejas→eventos, la columna es `evento_id`. En proyectos viejos puede seguir como pareja_id hasta ejecutar migrate_parejas_a_eventos.sql
alter table public.invitados add column if not exists evento_id uuid references public.eventos (id) on delete set null;
alter table public.invitados add column if not exists owner_user_id uuid references auth.users (id) on delete set null;
alter table public.invitados add column if not exists nombre_pasajero text;
alter table public.invitados add column if not exists email text;
alter table public.invitados add column if not exists telefono text;
alter table public.invitados add column if not exists restricciones_alimenticias text[];
alter table public.invitados add column if not exists rsvp_estado text default 'pendiente';
alter table public.invitados add column if not exists codigo_vuelo text default 'DM7726';
alter table public.invitados add column if not exists asiento text default '12A';
alter table public.invitados add column if not exists puerta text default 'B';
alter table public.invitados add column if not exists hora_embarque text default '17:30';
alter table public.invitados add column if not exists destino text default 'Forever Island';
alter table public.invitados add column if not exists nombre_evento text default 'Boda Dreams';
alter table public.invitados add column if not exists fecha_evento date default (current_date + interval '30 days');
alter table public.invitados add column if not exists motivo_viaje text;
alter table public.invitados add column if not exists nombre_acompanante text;
alter table public.invitados add column if not exists created_at timestamptz default now();

alter table public.invitados add column if not exists email_enviado boolean not null default false;
alter table public.invitados add column if not exists fecha_envio timestamptz;
alter table public.invitados add column if not exists invitacion_vista boolean not null default false;
alter table public.invitados add column if not exists fecha_ultima_vista timestamptz;
alter table public.invitados add column if not exists token_acceso uuid default gen_random_uuid();
alter table public.invitados add column if not exists qr_code_token text;
alter table public.invitados add column if not exists asistencia_confirmada boolean not null default false;

update public.invitados set token_acceso = gen_random_uuid() where token_acceso is null;
alter table public.invitados alter column token_acceso set not null;
alter table public.invitados alter column token_acceso set default gen_random_uuid();
create unique index if not exists invitados_token_acceso_key on public.invitados (token_acceso);

update public.invitados
set qr_code_token =
  replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
where qr_code_token is null;
alter table public.invitados alter column qr_code_token set not null;
create unique index if not exists invitados_qr_code_token_key on public.invitados (qr_code_token);

update public.invitados set nombre_pasajero = 'Invitado' where nombre_pasajero is null or trim(nombre_pasajero) = '';
alter table public.invitados alter column nombre_pasajero set default 'Invitado';
alter table public.invitados alter column nombre_pasajero set not null;

create or replace function public.trg_invitados_qr_token()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.qr_code_token is null or trim(new.qr_code_token) = '' then
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

notify pgrst, 'reload schema';
