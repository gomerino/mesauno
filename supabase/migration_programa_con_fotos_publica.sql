-- B02-05 v0: programa del día + fotos por ventanas de tiempo (misma fecha del evento, TZ fija).
-- Regla: ventana del hito i = [t_i - 45m, t_{i+1} - 1m]; último hito: [t_i - 45m, t_i + 3h].
-- Fotos: evento_fotos.created_at dentro de la ventana (timestamptz).

create or replace function public.programa_con_fotos_ventanas_publica(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $$
declare
  v_evento_id uuid;
  v_fecha date;
  v_tz text := 'America/Santiago';
  v_delta interval := interval '45 minutes';
  v_eps interval := interval '1 minute';
  v_tail interval := interval '3 hours';
  r_hitos jsonb := '[]'::jsonb;
  rec record;
  v_t_centro timestamptz;
  v_t_next timestamptz;
  v_w_start timestamptz;
  v_w_end timestamptz;
  v_day_start timestamptz;
  v_fotos jsonb;
begin
  select i.evento_id
  into v_evento_id
  from public.invitados i
  where i.evento_id is not null
    and (
      i.id::text = p_token
      or (i.token_acceso is not null and i.token_acceso::text = p_token)
    )
  limit 1;

  if v_evento_id is null then
    return jsonb_build_object(
      'ok', false,
      'codigo', 'invitacion_invalida',
      'hitos', '[]'::jsonb
    );
  end if;

  select coalesce(e.fecha_evento, e.fecha_boda, (timezone('utc', now()))::date)
  into v_fecha
  from public.eventos e
  where e.id = v_evento_id;

  v_day_start := (v_fecha::timestamp at time zone v_tz);

  for rec in
    select
      h.id,
      h.hora,
      h.titulo,
      h.descripcion_corta,
      h.lugar_nombre,
      h.ubicacion_url,
      h.icono,
      h.orden,
      lead(h.hora) over (order by h.orden asc, h.hora asc) as next_hora
    from public.evento_programa_hitos h
    where h.evento_id = v_evento_id
    order by h.orden asc, h.hora asc
  loop
    v_t_centro := ((v_fecha + rec.hora) at time zone v_tz);

    if rec.next_hora is not null then
      v_t_next := ((v_fecha + rec.next_hora) at time zone v_tz);
      v_w_end := v_t_next - v_eps;
    else
      v_w_end := v_t_centro + v_tail;
    end if;

    v_w_start := v_t_centro - v_delta;
    if v_w_start < v_day_start then
      v_w_start := v_day_start;
    end if;

    select
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', f.id,
            'storage_path', f.storage_path,
            'created_at', f.created_at
          )
          order by f.created_at desc
        ),
        '[]'::jsonb
      )
    into v_fotos
    from public.evento_fotos f
    where f.evento_id = v_evento_id
      and f.created_at >= v_w_start
      and f.created_at <= v_w_end;

    r_hitos := r_hitos || jsonb_build_array(
      jsonb_build_object(
        'hito_id', rec.id,
        'orden', rec.orden,
        'hora', rec.hora,
        'titulo', rec.titulo,
        'descripcion_corta', rec.descripcion_corta,
        'lugar_nombre', rec.lugar_nombre,
        'ubicacion_url', rec.ubicacion_url,
        'icono', rec.icono,
        'ventana_inicio', v_w_start,
        'ventana_fin', v_w_end,
        'fotos', coalesce(v_fotos, '[]'::jsonb)
      )
    );
  end loop;

  return jsonb_build_object(
    'ok', true,
    'evento_id', v_evento_id,
    'fecha_evento', v_fecha,
    'zonahoraria', v_tz,
    'hitos', r_hitos
  );
end;
$$;

revoke all on function public.programa_con_fotos_ventanas_publica(text) from public;
grant execute on function public.programa_con_fotos_ventanas_publica(text) to anon;
grant execute on function public.programa_con_fotos_ventanas_publica(text) to authenticated;
grant execute on function public.programa_con_fotos_ventanas_publica(text) to service_role;

-- ROLLBACK:
-- drop function if exists public.programa_con_fotos_ventanas_publica(text);
