-- Corrige UPDATE sobre invitados cuando no hay sesión (SQL Editor, migraciones, RPC mark_invitacion_vista como anon).
-- Error típico sin este parche: "No eres miembro de este evento" en línea del trigger con auth.uid() null.

create or replace function public.trg_invitados_owner_and_evento()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if coalesce(auth.jwt()->>'role', '') = 'service_role' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if auth.uid() is null then
      raise exception 'Sesión requerida' using errcode = '42501';
    end if;
    new.owner_user_id := auth.uid();
  end if;
  if new.evento_id is not null and auth.uid() is not null then
    if not exists (
      select 1 from public.evento_miembros m
      where m.evento_id = new.evento_id and m.user_id = auth.uid()
    ) then
      raise exception 'No eres miembro de este evento' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';
