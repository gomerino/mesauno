import { createStrictServiceClient } from "@/lib/supabase/server";
import { getSpotifyRedirectUri } from "@/lib/spotify-config";
import { verifySpotifyOAuthState } from "@/lib/spotify-oauth-state";
import { spotifyExchangeCode, spotifyFetchCurrentUserId } from "@/lib/spotify-api";
import { spotifyUpsertRefreshToken } from "@/lib/spotify-credentials";
import { getSiteOrigin } from "@/lib/public-origin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  const origin = await getSiteOrigin();
  const fail = (msg: string) => NextResponse.redirect(`${origin}/panel/evento?spotify_error=${encodeURIComponent(msg)}`);

  if (err) {
    return fail("Autorización cancelada o denegada.");
  }

  const eventoId = verifySpotifyOAuthState(state);
  if (!eventoId || !code) {
    return fail("Estado de sesión inválido o caducado. Vuelve a intentar.");
  }

  const redirectUri = getSpotifyRedirectUri();
  if (!redirectUri) {
    return fail("SPOTIFY_REDIRECT_URI no configurada.");
  }

  const tokens = await spotifyExchangeCode(code, redirectUri);
  if (!tokens?.access_token || !tokens.refresh_token) {
    return fail("No se pudo obtener el token de Spotify.");
  }

  const spotifyUserId = await spotifyFetchCurrentUserId(tokens.access_token);

  const db = await createStrictServiceClient();
  if (!db) {
    return fail("Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.");
  }

  const ok = await spotifyUpsertRefreshToken(db, eventoId, tokens.refresh_token, spotifyUserId);
  if (!ok) {
    return fail("No se pudo guardar la conexión en base de datos.");
  }

  return NextResponse.redirect(`${origin}/panel/evento?spotify=connected`);
}
