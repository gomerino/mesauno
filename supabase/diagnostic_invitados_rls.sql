-- Ejecutar en SQL Editor cuando falle RLS en invitados. Copiar resultados si pides ayuda.

-- Políticas actuales sobre invitados (restrictive = false → política restrictiva; deben cumplirse TODAS)
select
  pol.polname as policy_name,
  pol.polcmd as cmd_raw,
  case pol.polcmd
    when 'r' then 'SELECT'
    when 'a' then 'INSERT'
    when 'w' then 'UPDATE'
    when 'd' then 'DELETE'
    when '*' then 'ALL'
  end as cmd,
  pol.polpermissive as permissive,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expr,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expr
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'invitados'
order by pol.polpermissive, pol.polcmd, pol.polname;

-- Políticas restrictivas (si hay INSERT restrictiva, debe cumplirse ADEMÁS de las permisivas)
select pol.polname, pol.polpermissive
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'invitados';

-- Triggers en invitados
select tgname, tgenabled, pg_get_triggerdef(oid) as def
from pg_trigger
where tgrelid = 'public.invitados'::regclass
  and not tgisinternal;

-- ¿Existe la función del trigger?
select proname, pg_get_functiondef(p.oid) as src
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname = 'trg_invitados_owner_and_evento';
