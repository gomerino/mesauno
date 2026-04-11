import { spotifySearchRouteGET } from "@/lib/spotify-search-route";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return spotifySearchRouteGET(request);
}
