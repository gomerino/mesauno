-- Invitaciones por correo: métricas, token de URL pública, QR de check-in, RPC de tracking sin sesión.
-- Ejecutar en Supabase SQL Editor (idempotente en columnas).
--
-- Importante: sin esto, los UPDATE de backfill fallan en el SQL Editor (auth.uid() null) y mark_invitacion_vista
-- fallaría para anon. Ver comentario en la función.

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

alter table public.invitados
  add column if not exists email_enviado boolean not null default false;

alter table public.invitados
  add column if not exists fecha_envio timestamptz;

alter table public.invitados
  add column if not exists invitacion_vista boolean not null default false;

alter table public.invitados
  add column if not exists fecha_ultima_vista timestamptz;

alter table public.invitados
  add column if not exists token_acceso uuid default gen_random_uuid();

alter table public.invitados
  add column if not exists qr_code_token text;

-- token_acceso obligatorio y único
update public.invitados set token_acceso = gen_random_uuid() where token_acceso is null;
alter table public.invitados alter column token_acceso set not null;
alter table public.invitados alter column token_acceso set default gen_random_uuid();

create unique index if not exists invitados_token_acceso_key on public.invitados (token_acceso);

-- qr_code_token único (relleno para filas existentes)
update public.invitados
set qr_code_token =
  replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
where qr_code_token is null;

alter table public.invitados alter column qr_code_token set not null;

create unique index if not exists invitados_qr_code_token_key on public.invitados (qr_code_token);

create or replace function public.trg_invitados_qr_token()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.qr_code_token is null or trim(new.qr_code_token) = '' then
    new.qr_code_token :=
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_invitados_qr_token on public.invitados;
create trigger trg_invitados_qr_token
  before insert on public.invitados
  for each row
  execute procedure public.trg_invitados_qr_token();

-- Tracking de apertura sin login (anon puede ejecutar; la función valida el token).
create or replace function public.mark_invitacion_vista(p_token text)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v uuid;
begin
  begin
    v := trim(p_token)::uuid;
  exception
    when invalid_text_representation then
      return;
  end;

  update public.invitados
  set invitacion_vista = true,
      fecha_ultima_vista = now()
  where id = v or token_acceso = v;
end;
$$;

revoke all on function public.mark_invitacion_vista(text) from public;
grant execute on function public.mark_invitacion_vista(text) to anon, authenticated;

notify pgrst, 'reload schema';
