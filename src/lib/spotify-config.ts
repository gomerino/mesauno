export function getSpotifyClientId(): string | null {
  const v = process.env.SPOTIFY_CLIENT_ID?.trim();
  return v && !v.startsWith("tu_") ? v : null;
}

export function getSpotifyClientSecret(): string | null {
  const v = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  return v && !v.startsWith("tu_") ? v : null;
}

/**
 * URI fija (opcional). Si la defines, debe coincidir **exactamente** con una fila en
 * Spotify Developer → Redirect URIs (incluye esquema, host, puerto y ruta).
 */
export function getSpotifyRedirectUri(): string | null {
  const v = process.env.SPOTIFY_REDIRECT_URI?.trim();
  if (v) return v;
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (base) return `${base.replace(/\/$/, "")}/api/auth/spotify/callback`;
  return null;
}

/**
 * URI usada en authorize + token exchange. Prioridad: `SPOTIFY_REDIRECT_URI` si existe;
 * si no, se deriva del request (`origin` + `/api/auth/spotify/callback`) para que coincida
 * con `localhost` vs `127.0.0.1` y el puerto con los que el usuario abrió el panel.
 */
export function getSpotifyRedirectUriForRequest(request: Request): string | null {
  const explicit = process.env.SPOTIFY_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  try {
    const u = new URL(request.url);
    return `${u.origin}/api/auth/spotify/callback`;
  } catch {
    return null;
  }
}

export function getSpotifyOAuthStateSecret(): string {
  return (
    process.env.SPOTIFY_OAUTH_STATE_SECRET?.trim() ||
    process.env.SPOTIFY_CLIENT_SECRET?.trim() ||
    "dev-only-change-me"
  );
}

/** Scopes del flujo OAuth (Authorization Code) para la cuenta de los novios. */
export const SPOTIFY_MODIFY_SCOPES = [
  "playlist-modify-public",
  "playlist-modify-private",
  "user-read-playback-state",
  "user-library-read",
] as const;
