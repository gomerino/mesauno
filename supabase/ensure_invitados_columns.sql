-- Columnas esperadas por la app (idempotente).
-- El nombre del invitado en BD es nombre_pasajero (boarding pass).

alter table public.invitados add column if not exists pareja_id uuid references public.parejas (id) on delete set null;
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

update public.invitados set nombre_pasajero = 'Invitado' where nombre_pasajero is null or trim(nombre_pasajero) = '';
alter table public.invitados alter column nombre_pasajero set default 'Invitado';
alter table public.invitados alter column nombre_pasajero set not null;

notify pgrst, 'reload schema';
