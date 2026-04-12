-- Snapshot del evento para la landing /invitacion/[token] sin sesión.
-- La política eventos_select solo permite miembros; los invitados anónimos no leen `eventos`,
-- por eso el pase/motivo quedaban con datos legacy del row `invitados` (parecía “duro” en móvil).

create or replace function public.evento_para_invitacion_publica(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select jsonb_build_object(
    'id', e.id,
    'nombre_novio_1', e.nombre_novio_1,
    'nombre_novio_2', e.nombre_novio_2,
    'fecha_boda', e.fecha_boda,
    'nombre_evento', e.nombre_evento,
    'fecha_evento', e.fecha_evento,
    'destino', e.destino,
    'codigo_vuelo', e.codigo_vuelo,
    'hora_embarque', e.hora_embarque,
    'puerta', e.puerta,
    'asiento_default', e.asiento_default,
    'motivo_viaje', e.motivo_viaje,
    'lugar_evento_linea', e.lugar_evento_linea
  )
  from public.eventos e
  inner join public.invitados i on i.evento_id = e.id
  where i.evento_id is not null
    and (
      i.id::text = p_token
      or (i.token_acceso is not null and i.token_acceso::text = p_token)
    )
  limit 1;
$$;

revoke all on function public.evento_para_invitacion_publica(text) from public;
grant execute on function public.evento_para_invitacion_publica(text) to anon;
grant execute on function public.evento_para_invitacion_publica(text) to authenticated;
grant execute on function public.evento_para_invitacion_publica(text) to service_role;
