-- Panel: guardar acompañantes vía RPC (SECURITY DEFINER + row_security off),
-- igual que insert_invitado_panel, para evitar fallos 42501 en DELETE/INSERT con RLS.
-- Ejecutar en SQL Editor de Supabase.

create or replace function public.sync_invitado_acompanantes_panel(
  p_invitado_id uuid,
  p_nombres text[] default '{}'::text[]
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.invitados i
    where i.id = p_invitado_id
      and (
        i.owner_user_id = auth.uid()
        or (
          i.evento_id is not null
          and exists (
            select 1
            from public.evento_miembros m
            where m.evento_id = i.evento_id
              and m.user_id = auth.uid()
          )
        )
      )
  ) then
    raise exception 'No autorizado para editar acompañantes de este invitado' using errcode = '42501';
  end if;

  delete from public.invitado_acompanantes where invitado_id = p_invitado_id;

  if p_nombres is null or coalesce(array_length(p_nombres, 1), 0) = 0 then
    return;
  end if;

  insert into public.invitado_acompanantes (invitado_id, nombre, orden)
  select
    p_invitado_id,
    trim(t.n),
    (t.ord - 1)::smallint
  from unnest(p_nombres) with ordinality as t(n, ord)
  where length(trim(t.n)) > 0;
end;
$$;

revoke all on function public.sync_invitado_acompanantes_panel(uuid, text[]) from public;
grant execute on function public.sync_invitado_acompanantes_panel(uuid, text[]) to authenticated;

notify pgrst, 'reload schema';
