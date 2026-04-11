import { getSpotifyClientId, getSpotifyClientSecret } from "@/lib/spotify-config";
import { logSpotifyApiError } from "@/lib/spotify-api-error";

export type SpotifySearchTrack = {
  uri: string;
  id: string;
  name: string;
  artists: string;
  album: string;
  imageUrl: string | null;
};

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

async function postForm(url: string, body: string, headers: Record<string, string>): Promise<TokenResponse | null> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers },
    body,
  });
  if (!res.ok) {
    const t = await res.text();
    logSpotifyApiError("accounts/token", res.status, t);
    return null;
  }
  return (await res.json()) as TokenResponse;
}

export async function spotifyClientCredentialsAccessToken(): Promise<string | null> {
  const id = getSpotifyClientId();
  const secret = getSpotifyClientSecret();
  if (!id || !secret) return null;
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  return postForm(
    "https://accounts.spotify.com/api/token",
    "grant_type=client_credentials",
    { Authorization: `Basic ${basic}` }
  ).then((j) => j?.access_token ?? null);
}

export async function spotifyRefreshAccessToken(refreshToken: string): Promise<TokenResponse | null> {
  const id = getSpotifyClientId();
  const secret = getSpotifyClientSecret();
  if (!id || !secret) return null;
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  return postForm("https://accounts.spotify.com/api/token", body.toString(), { Authorization: `Basic ${basic}` });
}

export async function spotifyExchangeCode(code: string, redirectUri: string): Promise<TokenResponse | null> {
  const id = getSpotifyClientId();
  const secret = getSpotifyClientSecret();
  if (!id || !secret) return null;
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  return postForm("https://accounts.spotify.com/api/token", body.toString(), { Authorization: `Basic ${basic}` });
}

export async function spotifySearchTracks(accessToken: string, query: string, limit = 8): Promise<SpotifySearchTrack[]> {
  const q = query.trim();
  if (!q || q.length > 200) return [];
  const params = new URLSearchParams({ q, type: "track", limit: String(limit) });
  const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const bodyText = await res.text();
  if (!res.ok) {
    logSpotifyApiError("api/search", res.status, bodyText);
    return [];
  }
  const json = JSON.parse(bodyText) as {
    tracks?: {
      items?: Array<{
        uri: string;
        id: string;
        name: string;
        artists?: Array<{ name: string }>;
        album?: { name: string; images?: Array<{ url: string }> };
      }>;
    };
  };
  const items = json.tracks?.items ?? [];
  return items.map((t) => ({
    uri: t.uri,
    id: t.id,
    name: t.name,
    artists: (t.artists ?? []).map((a) => a.name).filter(Boolean).join(", "),
    album: t.album?.name ?? "",
    imageUrl: t.album?.images?.[0]?.url ?? t.album?.images?.[1]?.url ?? null,
  }));
}

export async function spotifyAddTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUris: string[]
): Promise<boolean> {
  if (trackUris.length === 0) return false;
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: trackUris }),
  });
  const bodyText = await res.text();
  if (!res.ok) {
    logSpotifyApiError("api/playlists/tracks (POST)", res.status, bodyText);
    return false;
  }
  return true;
}

export async function spotifyFetchCurrentUserId(
  accessToken: string,
  options?: { logFailure?: boolean }
): Promise<string | null> {
  const logFailure = options?.logFailure !== false;
  const token = accessToken?.trim();
  if (!token) return null;

  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const bodyText = await res.text();
  if (!res.ok) {
    if (logFailure) logSpotifyApiError("api/me", res.status, bodyText);
    return null;
  }
  const id = parseSpotifyMeUserId(bodyText);
  if (!id) {
    console.error("[spotify] api/me sin id/uri reconocible", bodyText.slice(0, 400));
  }
  return id;
}

/** Extrae el user id del JSON de GET /v1/me (`id` o `uri` spotify:user:…). */
export function parseSpotifyMeUserId(bodyText: string): string | null {
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(bodyText) as Record<string, unknown>;
  } catch (e) {
    console.error("[spotify] api/me JSON inválido", e, bodyText.slice(0, 300));
    return null;
  }
  const rawId = j.id;
  if (typeof rawId === "string" && rawId.trim()) return rawId.trim();
  const uri = j.uri;
  if (typeof uri === "string" && uri.startsWith("spotify:user:")) {
    const segment = uri.slice("spotify:user:".length).split(":")[0]?.trim();
    if (segment) return segment;
  }
  return null;
}

/** Si el access token es JWT, intenta leer `sub` (Spotify a veces emite JWT con el user id). */
function tryDecodeSpotifyUserIdFromJwt(accessToken: string): string | null {
  const parts = accessToken.trim().split(".");
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(b64, "base64").toString("utf8");
    const payload = JSON.parse(json) as { sub?: string };
    let sub = payload.sub?.trim();
    if (!sub) return null;
    if (sub.startsWith("spotify:user:")) sub = sub.slice("spotify:user:".length);
    return sub || null;
  } catch {
    return null;
  }
}

const ME_RETRY_MS = [0, 200, 500];

/**
 * Resuelve el Spotify user id tras el intercambio del código:
 * reintentos en /me, segundo intento con token renovado (a veces el primer access falla en /me),
 * y fallback JWT si el token lo permite.
 */
export async function spotifyResolveUserIdAfterAuthorization(
  accessToken: string,
  refreshToken: string
): Promise<{ spotifyUserId: string | null; refreshToken: string }> {
  let access = accessToken.trim();
  let refresh = refreshToken.trim();

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (let attempt = 0; attempt < ME_RETRY_MS.length; attempt++) {
    if (ME_RETRY_MS[attempt] > 0) await sleep(ME_RETRY_MS[attempt]);
    const lastTry = attempt === ME_RETRY_MS.length - 1;
    const id = await spotifyFetchCurrentUserId(access, { logFailure: lastTry });
    if (id) return { spotifyUserId: id, refreshToken: refresh };
  }

  const refreshed = await spotifyRefreshAccessToken(refresh);
  if (refreshed?.access_token) {
    access = refreshed.access_token.trim();
    if (refreshed.refresh_token) refresh = refreshed.refresh_token.trim();
    const id = await spotifyFetchCurrentUserId(access);
    if (id) return { spotifyUserId: id, refreshToken: refresh };
  }

  const fromJwt = tryDecodeSpotifyUserIdFromJwt(access);
  if (fromJwt) {
    console.warn("[spotify] spotify_user_id obtenido desde JWT (fallback); /me no devolvió id.");
    return { spotifyUserId: fromJwt, refreshToken: refresh };
  }

  console.warn(
    "[spotify] spotify_user_id sigue nulo: revisá /me en logs (403 = usuario no en dashboard de la app en modo development), credenciales y scopes."
  );
  return { spotifyUserId: null, refreshToken: refresh };
}

export type SpotifyPlaylistMetaOk = { ok: true; ownerId: string; collaborative: boolean };
export type SpotifyPlaylistMetaErr = { ok: false; status: number };
export type SpotifyPlaylistMetaResult = SpotifyPlaylistMetaOk | SpotifyPlaylistMetaErr;

/** Metadatos mínimos para validar la playlist (dueño y si es colaborativa). */
export async function spotifyFetchPlaylistOwner(
  accessToken: string,
  playlistId: string
): Promise<SpotifyPlaylistMetaResult> {
  const res = await fetch(`https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const bodyText = await res.text();
  if (!res.ok) {
    logSpotifyApiError("api/playlists (GET)", res.status, bodyText);
    return { ok: false, status: res.status };
  }
  let j: { owner?: { id?: string }; collaborative?: boolean };
  try {
    j = JSON.parse(bodyText) as { owner?: { id?: string }; collaborative?: boolean };
  } catch (e) {
    console.error("[spotify] playlist GET JSON inválido", e, bodyText.slice(0, 200));
    return { ok: false, status: 500 };
  }
  const ownerId = j.owner?.id?.trim();
  if (!ownerId) return { ok: false, status: 500 };
  return { ok: true, ownerId, collaborative: Boolean(j.collaborative) };
}

export async function spotifyCreatePlaylist(
  accessToken: string,
  spotifyUserId: string,
  name: string,
  opts?: { description?: string; public?: boolean }
): Promise<{ id: string } | null> {
  const res = await fetch(
    `https://api.spotify.com/v1/users/${encodeURIComponent(spotifyUserId)}/playlists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.slice(0, 100),
        public: opts?.public ?? true,
        description: opts?.description?.slice(0, 300) ?? "",
      }),
    }
  );
  const bodyText = await res.text();
  if (!res.ok) {
    logSpotifyApiError("api/users/playlists (POST)", res.status, bodyText);
    return null;
  }
  const j = JSON.parse(bodyText) as { id?: string };
  return j.id ? { id: j.id } : null;
}
