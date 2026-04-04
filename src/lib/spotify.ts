/** Extrae el ID de playlist desde una URL de Spotify (open.spotify.com). */
export function spotifyPlaylistIdFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (!u.hostname.includes("spotify.com")) return null;
    const m = u.pathname.match(/\/playlist\/([a-zA-Z0-9]+)/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

export function spotifyPlaylistEmbedSrc(playlistId: string): string {
  return `https://open.spotify.com/embed/playlist/${playlistId}?theme=0&utm_source=generator`;
}
