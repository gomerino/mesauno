-- Modo DJ: estado de reproducción simulada, token de acceso opcional, stub Spotify (fase 2).
-- Idempotente.

alter table public.playlists_evento
  add column if not exists dj_aporte_actual_id uuid references public.aportes_canciones (id) on delete set null,
  add column if not exists dj_reproduciendo boolean not null default false,
  add column if not exists dj_inicio_reproduccion_at timestamptz,
  add column if not exists dj_segundos_acumulados int not null default 0,
  add column if not exists dj_auto boolean not null default false,
  add column if not exists dj_sincronizar_cola_con_votos boolean not null default true,
  add column if not exists dj_token_acceso text,
  add column if not exists spotify_device_id text,
  add column if not exists spotify_access_token text;

comment on column public.playlists_evento.dj_aporte_actual_id is 'Aporte en reproducción (modo DJ simulado).';
comment on column public.playlists_evento.dj_reproduciendo is 'Si la reproducción simulada está en curso.';
comment on column public.playlists_evento.dj_inicio_reproduccion_at is 'Inicio del segmento actual de reproducción (para elapsed).';
comment on column public.playlists_evento.dj_segundos_acumulados is 'Segundos ya reproducidos antes del segmento actual (pause resume).';
comment on column public.playlists_evento.dj_auto is 'Auto DJ: avanza tema al terminar (simulado).';
comment on column public.playlists_evento.dj_sincronizar_cola_con_votos is 'Si false, los votos no recalculan la cola automática.';
comment on column public.playlists_evento.dj_token_acceso is 'Token secreto para URL /dj/[evento_id] sin login.';
comment on column public.playlists_evento.spotify_device_id is 'Fase 2: dispositivo Spotify objetivo (sin uso aún).';
comment on column public.playlists_evento.spotify_access_token is 'Fase 2: token de sesión (sin uso aún; no almacenar secretos reales sin cifrado).';

create index if not exists idx_playlists_evento_dj_token on public.playlists_evento (dj_token_acceso)
  where dj_token_acceso is not null;

-- ROLLBACK:
-- alter table public.playlists_evento drop column if exists spotify_access_token;
-- alter table public.playlists_evento drop column if exists spotify_device_id;
-- alter table public.playlists_evento drop column if exists dj_token_acceso;
-- alter table public.playlists_evento drop column if exists dj_sincronizar_cola_con_votos;
-- alter table public.playlists_evento drop column if exists dj_auto;
-- alter table public.playlists_evento drop column if exists dj_segundos_acumulados;
-- alter table public.playlists_evento drop column if exists dj_inicio_reproduccion_at;
-- alter table public.playlists_evento drop column if exists dj_reproduciendo;
-- alter table public.playlists_evento drop column if exists dj_aporte_actual_id;
