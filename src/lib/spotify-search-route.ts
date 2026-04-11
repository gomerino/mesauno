import { spotifyClientCredentialsAccessToken, spotifySearchTracks } from "@/lib/spotify-api";
import { getSpotifyClientId } from "@/lib/spotify-config";
import { rateLimitSpotifySearch } from "@/lib/spotify-rate-limit";
import { NextResponse } from "next/server";

export async function spotifySearchRouteGET(request: Request): Promise<Response> {
  if (!getSpotifyClientId()) {
    return NextResponse.json({ error: "Búsqueda no disponible." }, { status: 503 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!rateLimitSpotifySearch(ip)) {
    return NextResponse.json({ error: "Demasiadas búsquedas. Espera un momento." }, { status: 429 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ tracks: [] });
  }

  const token = await spotifyClientCredentialsAccessToken();
  if (!token) {
    return NextResponse.json({ error: "No se pudo autenticar con Spotify." }, { status: 502 });
  }

  const tracks = await spotifySearchTracks(token, q, 8);
  return NextResponse.json({ tracks });
}
