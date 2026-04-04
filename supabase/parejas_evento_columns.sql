-- Datos globales del evento y mensaje (tabla parejas = novios). Ejecutar en SQL Editor.

alter table public.parejas add column if not exists nombre_evento text;
alter table public.parejas add column if not exists fecha_evento date;
alter table public.parejas add column if not exists destino text;
alter table public.parejas add column if not exists codigo_vuelo text;
alter table public.parejas add column if not exists hora_embarque text;
alter table public.parejas add column if not exists puerta text;
alter table public.parejas add column if not exists asiento_default text;
alter table public.parejas add column if not exists motivo_viaje text;
alter table public.parejas add column if not exists lugar_evento_linea text;

notify pgrst, 'reload schema';
