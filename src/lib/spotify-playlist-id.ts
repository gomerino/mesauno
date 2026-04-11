/**
 * Extrae el ID de playlist desde URL de Spotify, URI `spotify:playlist:…` o texto plano.
 * Soporta rutas con locale, p. ej. `open.spotify.com/intl-es/playlist/…`.
 */
export function parseSpotifyPlaylistId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;

  const uri = s.match(/^spotify:playlist:([a-zA-Z0-9]+)$/i);
  if (uri?.[1]) return uri[1];

  const fromPath = s.match(/\/playlist\/([a-zA-Z0-9]{10,})(?:\?|$|\/)/i) ?? s.match(/\/playlist\/([a-zA-Z0-9]{10,})/i);
  if (fromPath?.[1]) return fromPath[1];

  if (/^[a-zA-Z0-9]{10,}$/.test(s)) return s;
  return null;
}
