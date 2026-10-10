-- Registrar antes de publicar el selector. No cambia eventos ni invitados existentes.
insert into public.themes (id, name, slug)
values ('editorial-premium', 'Editorial Premium', 'editorial-premium')
on conflict (id) do update
set name = excluded.name, slug = excluded.slug;

-- ROLLBACK: retirar solo cuando ningún evento o invitado utilice el tema.
-- delete from public.themes
-- where id = 'editorial-premium'
--   and not exists (select 1 from public.eventos where theme_id = 'editorial-premium')
--   and not exists (select 1 from public.invitados where theme_id = 'editorial-premium');
