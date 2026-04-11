"use server";

import { createClient, createStrictServiceClient } from "@/lib/supabase/server";
import { parseSpotifyPlaylistId } from "@/lib/spotify-playlist-id";
import { spotifyFetchPlaylistOwner, spotifyRefreshAccessToken } from "@/lib/spotify-api";
import { spotifyGetCredentials, spotifyUpdatePlaylistId, spotifyUpdateRefreshTokenIfPresent } from "@/lib/spotify-credentials";
import { revalidatePath } from "next/cache";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function saveSpotifyPlaylistIdAction(
  eventoId: string,
  playlistInput: string
): Promise<{ ok: boolean; error?: string }> {
  if (!eventoId || !UUID_RE.test(eventoId)) {
    return { ok: false, error: "Evento inválido." };
  }

  const parsed = parseSpotifyPlaylistId(playlistInput);
  if (!parsed) {
    return { ok: false, error: "Pega el enlace de la playlist o su ID de Spotify." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sesión requerida." };
  }

  const { data: isAdmin, error: aErr } = await supabase.rpc("user_is_evento_admin", { p_evento_id: eventoId });
  if (aErr || !isAdmin) {
    return { ok: false, error: "Solo el administrador puede configurar la playlist." };
  }

  const db = await createStrictServiceClient();
  if (!db) {
    return { ok: false, error: "Servidor sin credenciales de servicio." };
  }

  const creds = await spotifyGetCredentials(db, eventoId);
  if (!creds?.refresh_token) {
    return { ok: false, error: "Primero vinculá tu cuenta de Spotify." };
  }
  if (!creds.spotify_user_id?.trim()) {
    return {
      ok: false,
      error: "Volvé a autorizar Spotify en el panel para poder validar la playlist.",
    };
  }

  const refreshed = await spotifyRefreshAccessToken(creds.refresh_token);
  if (!refreshed?.access_token) {
    return { ok: false, error: "No pudimos renovar el acceso a Spotify. Volvé a vincular la cuenta." };
  }
  await spotifyUpdateRefreshTokenIfPresent(db, eventoId, refreshed.refresh_token);

  const playlistMeta = await spotifyFetchPlaylistOwner(refreshed.access_token, parsed);
  if (!playlistMeta) {
    return {
      ok: false,
      error:
        "No pudimos leer esa playlist con tu cuenta de Spotify. Revisá el enlace o el ID; si la lista es de otra persona, no podremos añadir canciones.",
    };
  }
  if (playlistMeta.ownerId !== creds.spotify_user_id) {
    return {
      ok: false,
      error:
        "La playlist tiene que ser de la misma cuenta de Spotify que vinculaste (Spotify devuelve 403 si intentás modificar una lista de otra persona).",
    };
  }

  const res = await spotifyUpdatePlaylistId(db, eventoId, parsed);
  if (!res.ok) {
    return { ok: false, error: res.error ?? "No se pudo guardar." };
  }

  revalidatePath("/panel/evento");
  return { ok: true };
}

export async function disconnectSpotifyAction(eventoId: string): Promise<{ ok: boolean; error?: string }> {
  if (!eventoId || !UUID_RE.test(eventoId)) {
    return { ok: false, error: "Evento inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sesión requerida." };
  }

  const { data: isAdmin, error: aErr } = await supabase.rpc("user_is_evento_admin", { p_evento_id: eventoId });
  if (aErr || !isAdmin) {
    return { ok: false, error: "No autorizado." };
  }

  const db = await createStrictServiceClient();
  if (!db) {
    return { ok: false, error: "Servidor sin credenciales de servicio." };
  }

  const { error } = await db.from("evento_spotify").delete().eq("evento_id", eventoId);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/panel/evento");
  return { ok: true };
}
