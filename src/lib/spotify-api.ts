import { getSpotifyClientId, getSpotifyClientSecret } from "@/lib/spotify-config";

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
    console.error("[spotify] token error", res.status, t.slice(0, 200));
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
  if (!res.ok) {
    console.error("[spotify] search", res.status);
    return [];
  }
  const json = (await res.json()) as {
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
  if (!res.ok) {
    const t = await res.text();
    console.error("[spotify] add tracks", res.status, t.slice(0, 300));
    return false;
  }
  return true;
}

export async function spotifyFetchCurrentUserId(accessToken: string): Promise<string | null> {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { id?: string };
  return j.id ?? null;
}
