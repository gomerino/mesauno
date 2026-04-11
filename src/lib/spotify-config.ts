export function getSpotifyClientId(): string | null {
  const v = process.env.SPOTIFY_CLIENT_ID?.trim();
  return v && !v.startsWith("tu_") ? v : null;
}

export function getSpotifyClientSecret(): string | null {
  const v = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  return v && !v.startsWith("tu_") ? v : null;
}

export function getSpotifyRedirectUri(): string | null {
  const v = process.env.SPOTIFY_REDIRECT_URI?.trim();
  if (v) return v;
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (base) return `${base.replace(/\/$/, "")}/api/auth/spotify/callback`;
  return null;
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
