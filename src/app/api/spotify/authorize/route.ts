import { createClient } from "@/lib/supabase/server";
import { getSpotifyClientId, getSpotifyRedirectUri, SPOTIFY_MODIFY_SCOPES } from "@/lib/spotify-config";
import { signSpotifyOAuthState } from "@/lib/spotify-oauth-state";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const clientId = getSpotifyClientId();
  const redirectUri = getSpotifyRedirectUri();
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
