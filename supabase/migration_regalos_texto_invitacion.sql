-- Texto acompañante de regalos en la invitación + lectura pública por token.
-- Idempotente.

alter table public.configuracion_invitacion_evento
  add column if not exists texto_regalos text;

comment on column public.configuracion_invitacion_evento.texto_regalos is
  'Mensaje visible junto al enlace de regalos en la invitación pública.';

create or replace function public.configuracion_regalos_publica(p_token text)
returns table (
  regalos_activos boolean,
  url_regalos text,
  texto_regalos text
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    coalesce(c.regalos_activos, false) as regalos_activos,
    c.url_regalos,
    c.texto_regalos
  from public.invitados i
  left join public.configuracion_invitacion_evento c on c.evento_id = i.evento_id
  where i.evento_id is not null
    and (
      i.id::text = p_token
      or (i.token_acceso is not null and i.token_acceso::text = p_token)
    )
  limit 1;
$$;

revoke all on function public.configuracion_regalos_publica(text) from public;
grant execute on function public.configuracion_regalos_publica(text) to anon;
grant execute on function public.configuracion_regalos_publica(text) to authenticated;
grant execute on function public.configuracion_regalos_publica(text) to service_role;

-- ROLLBACK
-- drop function if exists public.configuracion_regalos_publica(text);
-- alter table public.configuracion_invitacion_evento drop column if exists texto_regalos;
