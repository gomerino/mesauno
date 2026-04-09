/** Extrae el ID de playlist desde URL de Spotify o devuelve el texto si ya es un id. */
export function parseSpotifyPlaylistId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  const m = s.match(/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/i);
  if (m?.[1]) return m[1];
  if (/^[a-zA-Z0-9]{10,}$/.test(s)) return s;
  return null;
}
