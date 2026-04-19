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
  /** Espacios separados; opcional en refresh. */
  scope?: string;
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

/** Si `scope` viene vacío o no viene, no se asume ausencia de permisos (Spotify a veces omite el campo). */
export function spotifyGrantedScopesIncludePlaylistModify(scope: string | null | undefined): boolean {
  if (scope == null || String(scope).trim() === "") return true;
  const parts = String(scope).trim().split(/\s+/);
  return parts.includes("playlist-modify-public") || parts.includes("playlist-modify-private");
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

export type SpotifySearchTracksResult =
  | { ok: true; tracks: SpotifySearchTrack[] }
  | { ok: false; status: number; spotifyMessage: string };

export async function spotifySearchTracksDetailed(
  accessToken: string,
  query: string,
  limit = 8
): Promise<SpotifySearchTracksResult> {
  const q = query.trim();
  if (!q || q.length > 200) return { ok: true, tracks: [] };
  const params = new URLSearchParams({ q, type: "track", limit: String(limit) });
  const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const bodyText = await res.text();
  if (!res.ok) {
    logSpotifyApiError("api/search", res.status, bodyText);
    return { ok: false, status: res.status, spotifyMessage: extractSpotifyWebApiErrorMessage(bodyText) };
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
  return {
    ok: true,
    tracks: items.map((t) => ({
    uri: t.uri,
    id: t.id,
    name: t.name,
    artists: (t.artists ?? []).map((a) => a.name).filter(Boolean).join(", "),
    album: t.album?.name ?? "",
    imageUrl: t.album?.images?.[0]?.url ?? t.album?.images?.[1]?.url ?? null,
    })),
  };
}

export async function spotifySearchTracks(accessToken: string, query: string, limit = 8): Promise<SpotifySearchTrack[]> {
  const res = await spotifySearchTracksDetailed(accessToken, query, limit);
  return res.ok ? res.tracks : [];
}

export type SpotifyAddTracksResult = { ok: true } | { ok: false; status: number; spotifyMessage: string };

/**
 * Añade tracks a una playlist. Requiere token del usuario con scopes `playlist-modify-*`
 * y que pueda editar esa lista (dueño o colaborador en lista colaborativa).
 */
export async function spotifyAddTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUris: string[]
): Promise<SpotifyAddTracksResult> {
  if (trackUris.length === 0) {
    return { ok: false, status: 400, spotifyMessage: "empty uris" };
  }
  const id = playlistId.trim();
  const res = await fetch(`https://api.spotify.com/v1/playlists/${encodeURIComponent(id)}/tracks`, {
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
    const spotifyMessage = extractSpotifyWebApiErrorMessage(bodyText);
    return { ok: false, status: res.status, spotifyMessage };
  }
  return { ok: true };
}

/** Mensaje `error.message` de la Web API (formato varía entre endpoints). */
export function extractSpotifyWebApiErrorMessage(bodyText: string): string {
  const raw = bodyText.trim();
  if (!raw) return "";
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    const err = j.error;
    if (typeof err === "string") return err.slice(0, 500);
    if (err && typeof err === "object") {
      const o = err as Record<string, unknown>;
      if (typeof o.message === "string") return o.message.slice(0, 500);
      const nested = o.error;
      if (nested && typeof nested === "object" && typeof (nested as { message?: string }).message === "string") {
        return String((nested as { message: string }).message).slice(0, 500);
      }
    }
  } catch {
    /* no JSON */
  }
  return raw.slice(0, 500);
}

/** Mensaje para UI (español); sin filtrar PII — solo status y texto de Spotify. */
export function mensajeUsuarioSpotifyAddTrack(status: number, spotifyMessage: string): string {
  const m = spotifyMessage.toLowerCase();
  if (status === 401) {
    return "La sesión con Spotify expiró. Quien organiza el evento debe volver a vincular la cuenta en el panel.";
  }
  if (status === 404) {
    return "Spotify no encontró la playlist. Revisa en el panel que el enlace o el ID de la lista sean correctos.";
  }
  if (status === 429) {
    return "Spotify pidió esperar un momento por demasiados intentos. Prueba de nuevo en unos segundos.";
  }
  if (status === 403) {
    if (!m.trim() || /^forbidden\.?$/i.test(m)) {
      return (
        "Spotify no permitió modificar la playlist (403). Suele deberse a permisos viejos: en https://www.spotify.com/account/apps quita el acceso a esta app y vuelve a vincular Spotify desde el panel. " +
        "Si la lista está en modo colaborativo, prueba una playlist nueva sin colaboración."
      );
    }
    if (/scope|insufficient|privilege|permission/i.test(m)) {
      return "Spotify no permitió modificar la playlist (faltan permisos). Pulsa «Volver a autorizar Spotify» en el panel del evento y acepta los permisos.";
    }
    if (/registered|developer dashboard|not registered|not allowed/i.test(m)) {
      return "Spotify bloqueó la acción: en modo desarrollo, tu cuenta debe figurar en «Users and access» de la app en developer.spotify.com (mismo correo que la cuenta de Spotify vinculada).";
    }
    if (/restriction|market|territory|not available in/i.test(m)) {
      return "Spotify no permite añadir esta canción en tu región o a esta playlist. Prueba con otra pista.";
    }
    if (/collaborative|owner|only the owner|cannot modify/i.test(m)) {
      return "Spotify no permite editar esta lista con la cuenta vinculada. Crea una playlist nueva con esa cuenta en Spotify y pégala en el panel, o usa la lista que creó la app al conectar.";
    }
    return (
      "Spotify no permitió añadir la canción. Quien organiza el evento puede revisar la ayuda de «Música colaborativa» en el panel: " +
      "usuario en el dashboard de desarrolladores, playlist propia de la cuenta vinculada y volver a autorizar Spotify."
    );
  }
  if (status === 400) {
    if (/invalid/i.test(m)) {
      return "Spotify rechazó los datos de la canción. Prueba con otra pista o actualiza la página.";
    }
  }
  return "Spotify no pudo añadir la canción. Si persiste, quien organiza el evento puede revisar la playlist y volver a conectar Spotify en el panel.";
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
    "[spotify] spotify_user_id sigue nulo: revisa /me en logs (403 = usuario no en dashboard de la app en modo development), credenciales y scopes."
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
