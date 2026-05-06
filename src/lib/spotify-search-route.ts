import { spotifyClientCredentialsAccessToken, spotifySearchTracksDetailed } from "@/lib/spotify-api";
import { getSpotifyClientId, getSpotifyClientSecret } from "@/lib/spotify-config";
import { rateLimitSpotifySearch } from "@/lib/spotify-rate-limit";
import { NextResponse } from "next/server";

/**
 * Búsqueda para invitados: solo Client Credentials (client_id + client_secret).
 * No usa el token OAuth del novio, así que no depende de su sesión ni de sus scopes.
 */
export async function spotifySearchRouteGET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ tracks: [] });
  }

  if (!getSpotifyClientId() || !getSpotifyClientSecret()) {
    return NextResponse.json({ tracks: [] });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!rateLimitSpotifySearch(ip)) {
    return NextResponse.json({ tracks: [] });
  }

  const token = await spotifyClientCredentialsAccessToken();
  if (!token) {
    return NextResponse.json({ tracks: [] });
  }

  const first = await spotifySearchTracksDetailed(token, q, 8);
  if (first.ok) {
    return NextResponse.json({ tracks: first.tracks });
  }

  if (first.status === 401) {
    const retryToken = await spotifyClientCredentialsAccessToken();
    if (retryToken) {
      const second = await spotifySearchTracksDetailed(retryToken, q, 8);
      if (second.ok) return NextResponse.json({ tracks: second.tracks });
    }
  }

  return NextResponse.json({ tracks: [] });
}
