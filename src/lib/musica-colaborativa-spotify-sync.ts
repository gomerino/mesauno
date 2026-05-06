import {
  spotifyAccessTokenAllowsPlaylistModify,
  spotifyAddTracksToPlaylist,
  spotifyCreatePlaylist,
  spotifyFetchCurrentUserId,
  spotifyRefreshAccessToken,
  spotifyReplacePlaylistTracks,
} from "@/lib/spotify-api";
import { musicaUrisAprobadasOrdenadas } from "@/lib/musica-colaborativa";
import {
  spotifyGetCredentials,
  spotifyUpdatePlaylistId,
  spotifyUpdateRefreshTokenIfPresent,
} from "@/lib/spotify-credentials";
import type { SupabaseClient } from "@supabase/supabase-js";

async function playlistNombreDesdeEvento(db: SupabaseClient, eventoId: string): Promise<string> {
  const { data } = await db
    .from("eventos")
    .select("nombre_evento, nombre_novio_1, nombre_novio_2")
    .eq("id", eventoId)
    .maybeSingle();
  const row = data as {
    nombre_evento?: string | null;
    nombre_novio_1?: string | null;
    nombre_novio_2?: string | null;
  } | null;
  const n =
    row?.nombre_evento?.trim() ||
    [row?.nombre_novio_1, row?.nombre_novio_2].filter(Boolean).join(" & ").trim();
  const base = n ? `Jurnex — ${n}` : "Jurnex — playlist del evento";
  return base.slice(0, 100);
}

async function upsertPlaylistsEvento(
  db: SupabaseClient,
  eventoId: string,
  spotifyPlaylistId: string,
  estado: "draft" | "conectada"
): Promise<void> {
  await db.from("playlists_evento").upsert(
    {
      evento_id: eventoId,
      spotify_playlist_id: spotifyPlaylistId,
      estado,
    },
    { onConflict: "evento_id" }
  );
}

/** Sincroniza canciones aprobadas hacia la playlist Spotify del evento (manual, servidor). */
export async function musicaEjecutarSyncSpotify(
  db: SupabaseClient,
  eventoId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const creds = await spotifyGetCredentials(db, eventoId);
  if (!creds?.refresh_token?.trim()) {
    return { ok: false, message: "Spotify no está vinculado para este evento." };
  }

  const refreshed = await spotifyRefreshAccessToken(creds.refresh_token);
  if (!refreshed?.access_token) {
    return { ok: false, message: "No pudimos renovar la sesión con Spotify." };
  }
  await spotifyUpdateRefreshTokenIfPresent(db, eventoId, refreshed.refresh_token);

  if (!spotifyAccessTokenAllowsPlaylistModify(refreshed.access_token, refreshed.scope)) {
    return { ok: false, message: "Faltan permisos para editar playlists en Spotify." };
  }

  let spotifyUserId = creds.spotify_user_id?.trim() || null;
  if (!spotifyUserId) {
    spotifyUserId = await spotifyFetchCurrentUserId(refreshed.access_token);
    if (!spotifyUserId) {
      return { ok: false, message: "No pudimos obtener tu usuario de Spotify." };
    }
  }

  const { data: peRow } = await db
    .from("playlists_evento")
    .select("spotify_playlist_id")
    .eq("evento_id", eventoId)
    .maybeSingle();

  let playlistId =
    (peRow as { spotify_playlist_id?: string | null } | null)?.spotify_playlist_id?.trim() ||
    creds.playlist_id?.trim() ||
    null;

  if (!playlistId) {
    const nombre = await playlistNombreDesdeEvento(db, eventoId);
    const created = await spotifyCreatePlaylist(refreshed.access_token, spotifyUserId, nombre, {
      description: "Playlist del evento (Jurnex)",
      public: true,
    });
    if (!created?.id) {
      return { ok: false, message: "No pudimos crear la playlist en Spotify." };
    }
    playlistId = created.id;
    await spotifyUpdatePlaylistId(db, eventoId, playlistId);
    await upsertPlaylistsEvento(db, eventoId, playlistId, "conectada");
  } else {
    await upsertPlaylistsEvento(db, eventoId, playlistId, "conectada");
    if (!creds.playlist_id?.trim()) {
      await spotifyUpdatePlaylistId(db, eventoId, playlistId);
    }
  }

  const uris = await musicaUrisAprobadasOrdenadas(db, eventoId);
  const first = uris.slice(0, 100);
  const rest = uris.slice(100);

  const put = await spotifyReplacePlaylistTracks(refreshed.access_token, playlistId, first);
  if (!put.ok) {
    return { ok: false, message: "Spotify no permitió actualizar la playlist." };
  }

  for (let i = 0; i < rest.length; i += 100) {
    const chunk = rest.slice(i, i + 100);
    const add = await spotifyAddTracksToPlaylist(refreshed.access_token, playlistId, chunk);
    if (!add.ok) {
      return { ok: false, message: "Spotify no permitió añadir algunas canciones." };
    }
  }

  return { ok: true };
}
