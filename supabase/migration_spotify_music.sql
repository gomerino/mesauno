-- Música colaborativa (Spotify). Credenciales y aportes: solo backend con service_role (RLS sin políticas = denegado a anon/authenticated).

create table if not exists public.evento_spotify (
  evento_id uuid primary key references public.eventos (id) on delete cascade,
  refresh_token text,
  playlist_id text,
  spotify_user_id text,
  updated_at timestamptz not null default now()
);

comment on table public.evento_spotify is 'OAuth Spotify del admin; leer/escribir solo vía service_role o RPC definer.';
comment on column public.evento_spotify.refresh_token is 'Secreto: nunca exponer al cliente.';

create table if not exists public.playlist_aportes (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  invitado_id uuid not null references public.invitados (id) on delete cascade,
  track_uri text not null,
  track_name text,
  artist_names text,
  album_name text,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_playlist_aportes_evento_created
  on public.playlist_aportes (evento_id, created_at desc);

comment on table public.playlist_aportes is 'Sugerencias de canciones; lectura/escritura solo servidor.';

alter table public.evento_spotify enable row level security;
alter table public.playlist_aportes enable row level security;
