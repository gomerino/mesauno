-- Tema de invitación a nivel evento (Jurnex).
-- Antes el tema vivía solo en invitados.theme_id; ahora lo resuelve eventos.theme_id
-- y los invitados se mantienen sincronizados cuando se cambia el tema del evento.

-- 1) Columna a nivel evento.
alter table public.eventos
  add column if not exists theme_id text not null default 'legacy'
  references public.themes (id) on update cascade on delete restrict;

create index if not exists idx_eventos_theme on public.eventos (theme_id);

comment on column public.eventos.theme_id is
  'Tema visual de las invitaciones del evento (themes.id). Se propaga a invitados.theme_id al actualizarse.';

-- 2) Backfill: eventos existentes hoy tienen theme_id = default ('legacy'). Nada más que hacer.

-- 3) RPC: aplica el tema al evento y sincroniza sus invitados.
--    SECURITY DEFINER es intencional: la RPC debe poder escribir eventos+invitados en bulk
--    tras verificar que el caller es admin del evento. Mitigaciones:
--      - Check explícito de permisos mediante user_is_evento_admin().
--      - search_path = '' + referencias totalmente calificadas (anti schema-hijack).
--      - GRANT EXECUTE solo a authenticated (nunca a anon).
create or replace function public.apply_evento_theme(
  p_evento_id uuid,
  p_theme_id text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(public.user_is_evento_admin(p_evento_id), false) = false then
    raise exception 'No tienes permisos para modificar este evento' using errcode = '42501';
  end if;

  if not exists (select 1 from public.themes where id = p_theme_id) then
    raise exception 'Tema % no existe en public.themes', p_theme_id using errcode = '22023';
  end if;

  update public.eventos
     set theme_id = p_theme_id
   where id = p_evento_id;

  update public.invitados
     set theme_id = p_theme_id
   where evento_id = p_evento_id;
end;
$$;

revoke all on function public.apply_evento_theme(uuid, text) from public;
revoke all on function public.apply_evento_theme(uuid, text) from anon;
grant execute on function public.apply_evento_theme(uuid, text) to authenticated;

comment on function public.apply_evento_theme(uuid, text) is
  'Actualiza eventos.theme_id y sincroniza todos los invitados del evento al mismo tema. SECURITY DEFINER con check de user_is_evento_admin(). Solo authenticated.';
