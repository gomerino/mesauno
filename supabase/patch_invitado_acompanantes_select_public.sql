-- Filas en invitado_acompanantes visibles en SQL Editor pero no en la app / invitación:
-- el cliente usa anon + RLS; hace falta SELECT permisivo como en schema.sql.
-- (Si solo invitados tenía `using (true)` y esta tabla no, el embed y la query directa devolvían 0 filas.)

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
      and c.relname = 'invitado_acompanantes'
      and pol.polcmd = 'r'
  ) loop
    execute format('drop policy if exists %I on public.invitado_acompanantes', r.policyname);
  end loop;
end $$;

create policy "invitado_acompanantes_select_public" on public.invitado_acompanantes
  for select
  using (true);

grant select on table public.invitado_acompanantes to anon, authenticated;

notify pgrst, 'reload schema';
