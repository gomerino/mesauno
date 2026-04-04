-- Pareja o acompañante en la misma invitación (nombre en el pase).
alter table public.invitados add column if not exists nombre_acompanante text;

notify pgrst, 'reload schema';
