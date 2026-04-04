-- Ejecutar en SQL Editor si falla el guardado con:
-- "new row violates row-level security policy for table invitados"
--
-- Sustituye las políticas por la versión alineada con la app (owner_user_id obligatorio en altas).

drop policy if exists "invitados_insert_own" on public.invitados;
drop policy if exists "invitados_update_own" on public.invitados;
drop policy if exists "invitados_delete_own" on public.invitados;

create policy "invitados_insert_own" on public.invitados
  for insert with check (
    owner_user_id = auth.uid()
    and (
      pareja_id is null
      or exists (
        select 1 from public.parejas p
        where p.id = pareja_id and p.user_id = auth.uid()
      )
    )
  );

create policy "invitados_update_own" on public.invitados
  for update using (
    exists (select 1 from public.parejas p where p.id = pareja_id and p.user_id = auth.uid())
    or owner_user_id = auth.uid()
  );

create policy "invitados_delete_own" on public.invitados
  for delete using (
    exists (select 1 from public.parejas p where p.id = pareja_id and p.user_id = auth.uid())
    or owner_user_id = auth.uid()
  );

notify pgrst, 'reload schema';
