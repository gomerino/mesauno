-- Apoyos a canciones ya propuestas (voto sin reescribir en Spotify).

create table if not exists public.playlist_apoyos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  invitado_id uuid not null references public.invitados (id) on delete cascade,
  track_uri text not null,
  created_at timestamptz not null default now(),
  constraint playlist_apoyos_evento_invitado_track unique (evento_id, invitado_id, track_uri)
);

create index if not exists idx_playlist_apoyos_evento_track
  on public.playlist_apoyos (evento_id, track_uri);

comment on table public.playlist_apoyos is 'Apoyo a una canción ya presente en playlist_aportes; solo servidor (RLS sin políticas).';

alter table public.playlist_apoyos enable row level security;

-- ROLLBACK:
-- drop table if exists public.playlist_apoyos;
