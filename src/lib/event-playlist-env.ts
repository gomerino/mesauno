export type EventPlaylistUrls = {
  spotify: string | null;
  appleMusic: string | null;
  /** Otro servicio (YouTube Music, Tidal, etc.) */
  other: string | null;
  showSpotifyEmbed: boolean;
};

/**
 * Lee variables de entorno públicas para playlists.
 * - `NEXT_PUBLIC_EVENT_PLAYLIST_URL`: un solo enlace; se detecta Spotify vs Apple Music.
 * - O usa `NEXT_PUBLIC_SPOTIFY_PLAYLIST_URL` y/o `NEXT_PUBLIC_APPLE_MUSIC_PLAYLIST_URL` explícitas.
 */
export function resolveEventPlaylistEnv(): EventPlaylistUrls {
  const explicitSpotify = process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_URL?.trim() || null;
  const explicitApple = process.env.NEXT_PUBLIC_APPLE_MUSIC_PLAYLIST_URL?.trim() || null;
  const event = process.env.NEXT_PUBLIC_EVENT_PLAYLIST_URL?.trim() || null;
  const showSpotifyEmbed = process.env.NEXT_PUBLIC_SPOTIFY_EMBED === "1";

  let spotify = explicitSpotify;
  let appleMusic = explicitApple;
  let other: string | null = null;

  if (event) {
    const lower = event.toLowerCase();
    const isSpotify =
      lower.includes("open.spotify.com") ||
      lower.includes("spotify.link") ||
      lower.includes("spoti.fi");
    const isApple = lower.includes("music.apple.com");

    if (isSpotify && !spotify) spotify = event;
    else if (isApple && !appleMusic) appleMusic = event;
    else if (!isSpotify && !isApple) other = event;
  }

  return { spotify, appleMusic, other, showSpotifyEmbed };
}

export function hasAnyPlaylist(p: EventPlaylistUrls): boolean {
  return Boolean(p.spotify || p.appleMusic || p.other);
}
