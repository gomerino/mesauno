-- Panel vacío pero ¿hay filas en Table Editor / SQL?
-- El editor y el rol postgres ignoran RLS; el cliente (anon + JWT) no.
-- Si la política SELECT solo usa user_is_evento_member(evento_id), las filas con
-- evento_id IS NULL no pasan (NULL no coincide con ningún evento_miembros).
-- Este script deja una sola política de lectura alineada con schema.sql.

do $$
declare
  r record;
begin
  for r in (
    select pol.polname as policyname
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'invitados'
      and pol.polcmd = 'r'
  ) loop
    execute format('drop policy if exists %I on public.invitados', r.policyname);
  end loop;
end $$;

create policy "invitados_select_public" on public.invitados
  for select
  using (true);

grant select on table public.invitados to anon, authenticated;

-- Opcional: recargar esquema en PostgREST
-- notify pgrst, 'reload schema';
