-- Playlist colaborativa con aprobación y sync manual a Spotify (solo servidor / service_role).

create table if not exists public.playlists_evento (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  spotify_playlist_id text,
  estado text not null default 'draft' check (estado in ('draft', 'conectada')),
  created_at timestamptz not null default now(),
  constraint playlists_evento_evento_id_key unique (evento_id)
);

comment on table public.playlists_evento is 'Playlist Spotify del evento para sync manual de canciones aprobadas; lectura/escritura solo servidor.';

create table if not exists public.canciones (
  id uuid primary key default gen_random_uuid(),
  spotify_id text,
  titulo text not null,
  artista text not null default '',
  imagen text,
  duracion_ms int,
  created_at timestamptz not null default now(),
  constraint canciones_spotify_id_key unique (spotify_id)
);

comment on table public.canciones is 'Catálogo de pistas Spotify (spotify_id único cuando existe); solo servidor.';

create table if not exists public.aportes_canciones (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  usuario_id uuid references auth.users (id) on delete set null,
  invitado_id uuid references public.invitados (id) on delete cascade,
  cancion_id uuid not null references public.canciones (id) on delete cascade,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado')),
  fuente text not null default 'invitado' check (fuente in ('invitado', 'novio')),
  created_at timestamptz not null default now(),
  constraint aportes_canciones_quien_chk check (usuario_id is not null or invitado_id is not null),
  constraint aportes_canciones_evento_cancion_key unique (evento_id, cancion_id)
);

comment on table public.aportes_canciones is 'Sugerencias de música por invitado o novio; moderación antes de sync a Spotify; solo servidor.';
comment on column public.aportes_canciones.invitado_id is 'Quien propuso desde invitación (sin cuenta Supabase).';

create index if not exists idx_aportes_canciones_evento on public.aportes_canciones (evento_id);
create index if not exists idx_aportes_canciones_evento_estado on public.aportes_canciones (evento_id, estado);
create index if not exists idx_playlists_evento_evento on public.playlists_evento (evento_id);
create index if not exists idx_canciones_spotify_id on public.canciones (spotify_id) where spotify_id is not null;

insert into public.playlists_evento (evento_id, spotify_playlist_id, estado)
select es.evento_id, nullif(trim(es.playlist_id), ''), 'conectada'
from public.evento_spotify es
where es.playlist_id is not null and trim(es.playlist_id) <> ''
on conflict (evento_id) do nothing;

alter table public.playlists_evento enable row level security;
alter table public.canciones enable row level security;
alter table public.aportes_canciones enable row level security;

-- ROLLBACK:
-- drop table if exists public.aportes_canciones;
-- drop table if exists public.canciones;
-- drop table if exists public.playlists_evento;
