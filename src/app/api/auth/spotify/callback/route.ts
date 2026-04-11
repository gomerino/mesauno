import { spotifyOAuthCallbackGET, spotifyOAuthDynamic } from "@/lib/spotify-oauth";

export const dynamic = spotifyOAuthDynamic;

export async function GET(request: Request) {
  return spotifyOAuthCallbackGET(request);
}
