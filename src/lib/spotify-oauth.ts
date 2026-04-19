import { createClient, createStrictServiceClient } from "@/lib/supabase/server";
import { spotifyExchangeCode, spotifyCreatePlaylist, spotifyResolveUserIdAfterAuthorization } from "@/lib/spotify-api";
import { getSpotifyClientId, getSpotifyRedirectUriForRequest, SPOTIFY_MODIFY_SCOPES } from "@/lib/spotify-config";
import { signSpotifyOAuthState, verifySpotifyOAuthState } from "@/lib/spotify-oauth-state";
import { spotifyGetCredentials, spotifyUpdatePlaylistId, spotifyUpsertRefreshToken } from "@/lib/spotify-credentials";
import { weddingPlaylistNameFromEvento } from "@/lib/spotify-wedding-playlist";
import { getSiteOrigin } from "@/lib/public-origin";
import { NextResponse } from "next/server";

export const spotifyOAuthDynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function spotifyOAuthAuthorizeGET(request: Request): Promise<Response> {
  const clientId = getSpotifyClientId();
  const redirectUri = getSpotifyRedirectUriForRequest(request);
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Spotify no está configurado en el servidor." }, { status: 503 });
  }

  const url = new URL(request.url);
  const eventoId = url.searchParams.get("evento_id")?.trim();
  if (!eventoId || !UUID_RE.test(eventoId)) {
    return NextResponse.json({ error: "evento_id inválido" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent("/panel/evento")}`, request.url));
  }

  const { data: isAdmin, error } = await supabase.rpc("user_is_evento_admin", { p_evento_id: eventoId });
  if (error || !isAdmin) {
    return NextResponse.json({ error: "Solo el administrador puede conectar Spotify." }, { status: 403 });
  }

  const state = signSpotifyOAuthState(eventoId);
  // Scopes definidos en `spotify-config` (playlist-modify-*, playback, biblioteca).
  const scope = SPOTIFY_MODIFY_SCOPES.join(" ");
  const auth = new URL("https://accounts.spotify.com/authorize");
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("scope", scope);
  auth.searchParams.set("state", state);
  auth.searchParams.set("show_dialog", "true");

  return NextResponse.redirect(auth.toString());
}

export async function spotifyOAuthCallbackGET(request: Request): Promise<Response> {
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

  const redirectUri = getSpotifyRedirectUriForRequest(request);
  if (!redirectUri) {
    return fail("No se pudo resolver la URI de retorno de Spotify (revisa SPOTIFY_REDIRECT_URI o la URL del sitio).");
  }

  const tokens = await spotifyExchangeCode(code, redirectUri);
  if (!tokens?.access_token || !tokens.refresh_token) {
    return fail("No se pudo obtener el token de Spotify.");
  }

  const { spotifyUserId, refreshToken: refreshToStore } = await spotifyResolveUserIdAfterAuthorization(
    tokens.access_token,
    tokens.refresh_token
  );

  const db = await createStrictServiceClient();
  if (!db) {
    return fail("Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.");
  }

  const ok = await spotifyUpsertRefreshToken(db, eventoId, refreshToStore, spotifyUserId);
  if (!ok) {
    return fail("No se pudo guardar la conexión en base de datos.");
  }

  const creds = await spotifyGetCredentials(db, eventoId);
  if (!creds?.playlist_id && spotifyUserId) {
    const { data: eventoRow } = await db
      .from("eventos")
      .select("nombre_evento, nombre_novio_1, nombre_novio_2")
      .eq("id", eventoId)
      .maybeSingle();

    if (eventoRow) {
      const playlistName = weddingPlaylistNameFromEvento(eventoRow);
      const created = await spotifyCreatePlaylist(tokens.access_token, spotifyUserId, playlistName, {
        public: true,
        description: "Playlist colaborativa creada por Mesa Uno.",
      });
      if (created?.id) {
        await spotifyUpdatePlaylistId(db, eventoId, created.id);
      } else {
        console.warn("[spotify] no se pudo crear la playlist automática; el admin puede pegar un enlace manual.");
      }
    }
  }

  return NextResponse.redirect(`${origin}/panel/evento?spotify=connected`);
}
