-- B02-05 v0: programa del día + fotos por ventanas (TZ America/Santiago).
-- Partición sin solapes: cada hito i toma [w_start, w_end) con límites en el punto medio entre t_{i-1}↔t_i y t_i↔t_{i+1}.
-- Primer hito: w_start = max(inicio_día, t_0 - 45m). Último: w_end = t_last + 3h.
-- Fotos: created_at >= w_start AND created_at < w_end (una foto solo en un hito).
--
-- IMPORTANTE: ejecutar este archivo completo de una sola vez (una sola sentencia CREATE FUNCTION).
-- Si el editor parte por ";", usar "Run" sobre el bloque completo o pegar solo entre $function$ ... $function$.

create or replace function public.programa_con_fotos_ventanas_publica(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
set row_security = off
as $function$
  with inv as (
    select i.evento_id
    from public.invitados i
    where i.evento_id is not null
      and (
        i.id::text = p_token
        or (i.token_acceso is not null and i.token_acceso::text = p_token)
      )
    limit 1
  ),
  evt as (
    select
      inv.evento_id,
      coalesce(e.fecha_evento, e.fecha_boda, (timezone('utc', now()))::date) as fecha
    from inv
    inner join public.eventos e on e.id = inv.evento_id
  ),
  hitos_base as (
    select
      h.id,
      h.evento_id,
      h.hora,
      h.titulo,
      h.descripcion_corta,
      h.lugar_nombre,
      h.ubicacion_url,
      h.icono,
      h.orden,
      lag(h.hora) over (
        partition by h.evento_id
        order by h.orden asc, h.hora asc
      ) as prev_hora,
      lead(h.hora) over (
        partition by h.evento_id
        order by h.orden asc, h.hora asc
      ) as next_hora,
      evt.fecha as d
    from public.evento_programa_hitos h
    inner join evt on evt.evento_id = h.evento_id
  ),
  hitos_ts as (
    select
      hb.id as hito_id,
      hb.evento_id,
      hb.hora,
      hb.titulo,
      hb.descripcion_corta,
      hb.lugar_nombre,
      hb.ubicacion_url,
      hb.icono,
      hb.orden,
      ((hb.d + hb.hora) at time zone 'America/Santiago') as t_centro,
      (hb.d::timestamp at time zone 'America/Santiago') as day_start_tz,
      case
        when hb.prev_hora is null then null
        else ((hb.d + hb.prev_hora) at time zone 'America/Santiago')
      end as t_prev,
      case
        when hb.next_hora is null then null
        else ((hb.d + hb.next_hora) at time zone 'America/Santiago')
      end as t_next
    from hitos_base hb
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
      case
        when ht.t_prev is null then
          greatest(ht.day_start_tz, ht.t_centro - interval '45 minutes')
        else
          ht.t_prev + (ht.t_centro - ht.t_prev) / 2
      end as w_start,
      case
        when ht.t_next is null then
          ht.t_centro + interval '3 hours'
        else
          ht.t_centro + (ht.t_next - ht.t_centro) / 2
      end as w_end_exclusive
    from hitos_ts ht
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
      when not exists (select 1 from inv) then
        jsonb_build_object(
          'ok', false,
          'codigo', 'invitacion_invalida',
          'hitos', '[]'::jsonb
        )
      else
        jsonb_build_object(
          'ok', true,
          'evento_id', (select evento_id from evt limit 1),
          'fecha_evento', (select fecha from evt limit 1),
          'zonahoraria', 'America/Santiago',
          'hitos', (select hitos from hitos_json limit 1)
        )
    end
$function$;

revoke all on function public.programa_con_fotos_ventanas_publica(text) from public;
grant execute on function public.programa_con_fotos_ventanas_publica(text) to anon;
grant execute on function public.programa_con_fotos_ventanas_publica(text) to authenticated;
grant execute on function public.programa_con_fotos_ventanas_publica(text) to service_role;

-- ROLLBACK:
-- drop function if exists public.programa_con_fotos_ventanas_publica(text);
