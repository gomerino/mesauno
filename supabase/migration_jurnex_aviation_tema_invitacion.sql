-- Tema "Jurnex Aviation": misma estructura que soft-aviation, cromía de marca (public.themes).
-- Aplicar en el proyecto (SQL Editor o supabase db push) si aún no existe la fila; idempotente.
--
-- ROLLBACK (solo si hiciste el insert a mano y quieres revertir):
--   delete from public.themes where id = 'jurnex-aviation';
--   (no borrar si algún evento.eventos ya usa theme_id = 'jurnex-aviation')

insert into public.themes (id, name, slug)
values
  ('jurnex-aviation', 'Jurnex Aviation', 'jurnex-aviation')
on conflict (id) do update
set name = excluded.name,
  slug = excluded.slug;
