-- Opcional: si tu tabla tiene solo la columna "nombre" y quieres alinearla al repo:
-- 1) Añade nombre_pasajero y copia datos
-- 2) O renombra directamente (si no hay datos que romper)

-- Opción A — renombrar (si existe nombre y no existe nombre_pasajero aún)
-- alter table public.invitados rename column nombre to nombre_pasajero;

-- Opción B — mantener ambas un tiempo
-- alter table public.invitados add column if not exists nombre_pasajero text;
-- update public.invitados set nombre_pasajero = nombre where nombre_pasajero is null;
-- alter table public.invitados alter column nombre_pasajero set not null;
-- alter table public.invitados drop column if exists nombre;

notify pgrst, 'reload schema';
