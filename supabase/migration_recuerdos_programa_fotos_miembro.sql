-- Misma lógica que `programa_con_fotos_ventanas_publica`, filtrada por `evento_id` y
-- solo si el usuario autenticado es miembro del evento (panel → Recuerdos, descargas ZIP).

create or replace function public.programa_con_fotos_ventanas_miembro(p_evento_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
set row_security = off
as $function$
  with guard as (
    select public.user_is_evento_member(p_evento_id) as ok
  ),
  evt as (
    select
      e.id as evento_id,
      coalesce(e.fecha_evento, e.fecha_boda, (timezone('utc', now()))::date) as fecha
    from public.eventos e
    where e.id = p_evento_id
      and (select ok from guard)
  ),
  hitos_ts as (
    select
      h.id as hito_id,
      h.evento_id,
      h.hora,
      h.titulo,
      h.descripcion_corta,
      h.lugar_nombre,
      h.ubicacion_url,
      h.icono,
      h.orden,
      ((evt.fecha + h.hora) at time zone 'America/Santiago') as t_inicio
    from public.evento_programa_hitos h
    inner join evt on evt.evento_id = h.evento_id
  ),
  bloques as (
    select distinct ht.evento_id, ht.t_inicio
    from hitos_ts ht
  ),
  bloque_ventana as (
    select
      b.evento_id,
      b.t_inicio as w_start,
      coalesce(
        lead(b.t_inicio) over (
          partition by b.evento_id
          order by b.t_inicio asc
        ),
        b.t_inicio + interval '3 hours'
      ) as w_end_exclusive
    from bloques b
  ),
  hitos_win as (
    select
      ht.hito_id,
      ht.evento_id,
      ht.hora,
      ht.titulo,
      ht.descripcion_corta,
      ht.lugar_nombre,
      ht.ubicacion_url,
      ht.icono,
      ht.orden,
      bv.w_start,
      bv.w_end_exclusive
    from hitos_ts ht
    inner join bloque_ventana bv
      on bv.evento_id = ht.evento_id
      and bv.w_start = ht.t_inicio
  ),
  hitos_with_fotos as (
    select
      hw.hito_id,
      hw.orden,
      hw.hora,
      hw.titulo,
      hw.descripcion_corta,
      hw.lugar_nombre,
      hw.ubicacion_url,
      hw.icono,
      hw.w_start as ventana_inicio,
      hw.w_end_exclusive as ventana_fin,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', f.id,
              'storage_path', f.storage_path,
              'created_at', f.created_at
            )
            order by f.created_at desc
          )
          from public.evento_fotos f
          where f.evento_id = hw.evento_id
            and f.created_at >= hw.w_start
            and f.created_at < hw.w_end_exclusive
        ),
        '[]'::jsonb
      ) as fotos
    from hitos_win hw
  ),
  hitos_json as (
    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'hito_id', hf.hito_id,
            'orden', hf.orden,
            'hora', hf.hora,
            'titulo', hf.titulo,
            'descripcion_corta', hf.descripcion_corta,
            'lugar_nombre', hf.lugar_nombre,
            'ubicacion_url', hf.ubicacion_url,
            'icono', hf.icono,
            'ventana_inicio', hf.ventana_inicio,
            'ventana_fin', hf.ventana_fin,
            'fotos', hf.fotos
          )
          order by hf.orden asc, hf.hora asc
        )
        from hitos_with_fotos hf
      ),
      '[]'::jsonb
    ) as hitos
  )
  select
    case
      when not (select ok from guard) then
        jsonb_build_object('ok', false, 'codigo', 'sin_permisos', 'hitos', '[]'::jsonb)
      else
        jsonb_build_object(
          'ok', true,
          'evento_id', (select evento_id from evt limit 1),
          'fecha_evento', (select fecha from evt limit 1),
          'zonahoraria', 'America/Santiago',
          'hitos', coalesce((select hitos from hitos_json limit 1), '[]'::jsonb)
        )
    end
$function$;

revoke all on function public.programa_con_fotos_ventanas_miembro(uuid) from public;
grant execute on function public.programa_con_fotos_ventanas_miembro(uuid) to authenticated;
grant execute on function public.programa_con_fotos_ventanas_miembro(uuid) to service_role;

-- ROLLBACK:
-- drop function if exists public.programa_con_fotos_ventanas_miembro(uuid);
