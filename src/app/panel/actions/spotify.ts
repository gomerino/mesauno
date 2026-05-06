"use server";

import { eventoTienePlanExperienciaProducto } from "@/lib/evento-plan-access";
import { createClient, createStrictServiceClient } from "@/lib/supabase/server";
import { parseSpotifyPlaylistId } from "@/lib/spotify-playlist-id";
import {
  spotifyCreatePlaylist,
  spotifyFetchCurrentUserId,
  spotifyFetchPlaylistOwner,
  spotifyRefreshAccessToken,
} from "@/lib/spotify-api";
import {
  spotifyGetCredentials,
  spotifyUpdatePlaylistId,
  spotifyUpdateRefreshTokenIfPresent,
  spotifyUpsertRefreshToken,
} from "@/lib/spotify-credentials";
import { weddingPlaylistNameFromEvento } from "@/lib/spotify-wedding-playlist";
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

  const { data: planRow } = await db
    .from("eventos")
    .select("plan, plan_status")
    .eq("id", eventoId)
    .maybeSingle();
  if (!eventoTienePlanExperienciaProducto(planRow)) {
    return { ok: false, error: "La música colaborativa está disponible con el plan Experiencia." };
  }

  const creds = await spotifyGetCredentials(db, eventoId);
  if (!creds?.refresh_token) {
    return { ok: false, error: "Primero vincula tu cuenta de Spotify." };
  }
  if (!creds.spotify_user_id?.trim()) {
    return {
      ok: false,
      error: "Vuelve a autorizar Spotify en el panel para poder validar la playlist.",
    };
  }

  const refreshed = await spotifyRefreshAccessToken(creds.refresh_token);
  if (!refreshed?.access_token) {
    return { ok: false, error: "No pudimos renovar el acceso a Spotify. Vuelve a vincular la cuenta." };
  }
  await spotifyUpdateRefreshTokenIfPresent(db, eventoId, refreshed.refresh_token);

  const playlistMeta = await spotifyFetchPlaylistOwner(refreshed.access_token, parsed);
  if (!playlistMeta.ok) {
    if (playlistMeta.status === 404) {
      return {
        ok: false,
        error:
          "No encontramos esa playlist. Copia el enlace desde Spotify (Compartir → Copiar enlace al playlist) o revisa el ID.",
      };
    }
    if (playlistMeta.status === 403) {
      return {
        ok: false,
        error:
          "Spotify no permitió leer la playlist con tu cuenta (403). Si es privada de otra persona, no puedes usarla; si es tuya, prueba volver a vincular Spotify.",
      };
    }
    return {
      ok: false,
      error:
        "No pudimos leer esa playlist. Revisa el enlace (también sirve con /intl-es/ en la URL); si la lista es muy antigua o fue borrada, crea una nueva.",
    };
  }

  const ownerMatches = playlistMeta.ownerId === creds.spotify_user_id;
  if (!ownerMatches && !playlistMeta.collaborative) {
    return {
      ok: false,
      error:
        "Esta playlist es de otra cuenta. Usa una lista creada con la cuenta que vinculaste, o una lista colaborativa donde tu usuario sea colaborador.",
    };
  }

  const res = await spotifyUpdatePlaylistId(db, eventoId, parsed);
  if (!res.ok) {
    return { ok: false, error: res.error ?? "No se pudo guardar." };
  }

  revalidatePath("/panel/viaje");
  return { ok: true };
}

export async function resetSpotifyPlaylistAction(
  eventoId: string
): Promise<{ ok: boolean; playlistId?: string; error?: string }> {
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
    return { ok: false, error: "Solo el administrador puede resetear la playlist." };
  }

  const db = await createStrictServiceClient();
  if (!db) {
    return { ok: false, error: "Servidor sin credenciales de servicio." };
  }

  const { data: planRow } = await db
    .from("eventos")
    .select("plan, plan_status")
    .eq("id", eventoId)
    .maybeSingle();
  if (!eventoTienePlanExperienciaProducto(planRow)) {
    return { ok: false, error: "La música colaborativa está disponible con el plan Experiencia." };
  }

  const creds = await spotifyGetCredentials(db, eventoId);
  if (!creds?.refresh_token) {
    return { ok: false, error: "Primero vincula tu cuenta de Spotify." };
  }

  const refreshed = await spotifyRefreshAccessToken(creds.refresh_token);
  if (!refreshed?.access_token) {
    return { ok: false, error: "No pudimos renovar el acceso a Spotify. Vuelve a vincular la cuenta." };
  }
  await spotifyUpdateRefreshTokenIfPresent(db, eventoId, refreshed.refresh_token);

  let spotifyUserId = creds.spotify_user_id?.trim() || null;
  if (!spotifyUserId) {
    spotifyUserId = await spotifyFetchCurrentUserId(refreshed.access_token, { logFailure: true });
    if (!spotifyUserId) {
      return {
        ok: false,
        error:
          "Spotify no nos devolvió el id de usuario. En developer.spotify.com asegúrate de que esa cuenta esté en «Users and access» y vuelve a vincular Spotify.",
      };
    }
    await spotifyUpsertRefreshToken(db, eventoId, creds.refresh_token, spotifyUserId);
  }

  const { data: eventoRow } = await db
    .from("eventos")
    .select("nombre_evento, nombre_novio_1, nombre_novio_2")
    .eq("id", eventoId)
    .maybeSingle();
  const playlistName = eventoRow ? weddingPlaylistNameFromEvento(eventoRow) : "Boda — Playlist colaborativa";

  const created = await spotifyCreatePlaylist(refreshed.access_token, spotifyUserId, playlistName, {
    public: true,
    description: "Playlist creada por Mesa Uno con las canciones que sugieren los invitados.",
  });
  if (!created?.id) {
    return {
      ok: false,
      error:
        "Spotify no nos dejó crear la playlist. Comprueba que la cuenta vinculada esté en «Users and access» del dashboard y vuelve a probar.",
    };
  }

  const sanity = await spotifyFetchPlaylistOwner(refreshed.access_token, created.id);
  if (!sanity.ok || sanity.ownerId !== spotifyUserId) {
    return {
      ok: false,
      error: "Pudimos crear la playlist, pero no validó la propiedad. Vuelve a vincular Spotify e inténtalo otra vez.",
    };
  }

  const res = await spotifyUpdatePlaylistId(db, eventoId, created.id);
  if (!res.ok) {
    return { ok: false, error: res.error ?? "No pudimos guardar la playlist nueva." };
  }

  revalidatePath("/panel/viaje");
  return { ok: true, playlistId: created.id };
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

  revalidatePath("/panel/viaje");
  return { ok: true };
}
