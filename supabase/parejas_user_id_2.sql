-- Segundo acceso al panel (novio/a 2). Ejecutar en SQL Editor después de schema base.
-- Ambos usuarios pueden leer/escribir la misma fila `parejas` e invitados vinculados.

alter table public.parejas add column if not exists user_id_2 uuid references auth.users (id) on delete set null;

create unique index if not exists parejas_user_id_2_unique
  on public.parejas (user_id_2)
  where user_id_2 is not null;

drop policy if exists "parejas_own" on public.parejas;
create policy "parejas_own" on public.parejas
  for all using (auth.uid() = user_id or auth.uid() = user_id_2);

drop policy if exists "invitados_insert_own" on public.invitados;
create policy "invitados_insert_own" on public.invitados
  for insert with check (
    owner_user_id = auth.uid()
    and (
      pareja_id is null
      or exists (
        select 1 from public.parejas p
        where p.id = pareja_id
          and (p.user_id = auth.uid() or p.user_id_2 = auth.uid())
      )
    )
  );

drop policy if exists "invitados_update_own" on public.invitados;
create policy "invitados_update_own" on public.invitados
  for update using (
    exists (
      select 1 from public.parejas p
      where p.id = pareja_id and (p.user_id = auth.uid() or p.user_id_2 = auth.uid())
    )
    or owner_user_id = auth.uid()
  );

drop policy if exists "invitados_delete_own" on public.invitados;
create policy "invitados_delete_own" on public.invitados
  for delete using (
    exists (
      select 1 from public.parejas p
      where p.id = pareja_id and (p.user_id = auth.uid() or p.user_id_2 = auth.uid())
    )
    or owner_user_id = auth.uid()
  );

drop policy if exists "invitado_acompanantes_insert_own" on public.invitado_acompanantes;
create policy "invitado_acompanantes_insert_own" on public.invitado_acompanantes
  for insert with check (
    exists (
      select 1 from public.invitados i
      where i.id = invitado_id
        and (
          i.owner_user_id = auth.uid()
          or exists (
            select 1 from public.parejas p
            where p.id = i.pareja_id and (p.user_id = auth.uid() or p.user_id_2 = auth.uid())
          )
        )
    )
  );

drop policy if exists "invitado_acompanantes_update_own" on public.invitado_acompanantes;
create policy "invitado_acompanantes_update_own" on public.invitado_acompanantes
  for update using (
    exists (
      select 1 from public.invitados i
      where i.id = invitado_id
        and (
          i.owner_user_id = auth.uid()
          or exists (
            select 1 from public.parejas p
            where p.id = i.pareja_id and (p.user_id = auth.uid() or p.user_id_2 = auth.uid())
          )
        )
    )
  );

drop policy if exists "invitado_acompanantes_delete_own" on public.invitado_acompanantes;
create policy "invitado_acompanantes_delete_own" on public.invitado_acompanantes
  for delete using (
    exists (
      select 1 from public.invitados i
      where i.id = invitado_id
        and (
          i.owner_user_id = auth.uid()
          or exists (
            select 1 from public.parejas p
            where p.id = i.pareja_id and (p.user_id = auth.uid() or p.user_id_2 = auth.uid())
          )
        )
    )
  );

drop policy if exists "aportes_regalo_select" on public.aportes_regalo;
create policy "aportes_regalo_select" on public.aportes_regalo
  for select using (
    exists (
      select 1 from public.parejas p
      where p.id = pareja_id and (p.user_id = auth.uid() or p.user_id_2 = auth.uid())
    )
  );

drop policy if exists "aportes_regalo_insert" on public.aportes_regalo;
create policy "aportes_regalo_insert" on public.aportes_regalo
  for insert with check (
    exists (
      select 1 from public.parejas p
      where p.id = pareja_id and (p.user_id = auth.uid() or p.user_id_2 = auth.uid())
    )
  );

drop policy if exists "aportes_regalo_update" on public.aportes_regalo;
create policy "aportes_regalo_update" on public.aportes_regalo
  for update using (
    exists (
      select 1 from public.parejas p
      where p.id = pareja_id and (p.user_id = auth.uid() or p.user_id_2 = auth.uid())
    )
  );

drop policy if exists "aportes_regalo_delete" on public.aportes_regalo;
create policy "aportes_regalo_delete" on public.aportes_regalo
  for delete using (
    exists (
      select 1 from public.parejas p
      where p.id = pareja_id and (p.user_id = auth.uid() or p.user_id_2 = auth.uid())
    )
  );
