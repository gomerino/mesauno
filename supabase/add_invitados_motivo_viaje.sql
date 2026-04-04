-- Mensaje "motivo del viaje" configurable desde el panel (se replica en todos los invitados de la pareja).
alter table public.invitados add column if not exists motivo_viaje text;

notify pgrst, 'reload schema';
