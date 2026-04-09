-- Sustituye gen_random_bytes (requiere pgcrypto) por gen_random_uuid() del core.
-- Ejecutar si al insertar invitados falla: function gen_random_bytes(integer) does not exist

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

notify pgrst, 'reload schema';
