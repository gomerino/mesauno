"use server";

import { createClient, createStrictServiceClient } from "@/lib/supabase/server";
import { fetchInvitadoWithAcompanantes } from "@/lib/invitado-fetch";
import {
  playlistHayAporteParaTrack,
  playlistInsertApoyo,
  playlistInsertAporte,
  spotifyGetCredentials,
  spotifyUpdateRefreshTokenIfPresent,
  spotifyUpsertRefreshToken,
} from "@/lib/spotify-credentials";
import {
  mensajeUsuarioSpotifyAddTrack,
  spotifyAccessTokenAllowsPlaylistModify,
  spotifyAccessTokenJwtScopes,
  spotifyAddTracksToPlaylist,
  spotifyFetchCurrentUserId,
  spotifyFetchPlaylistOwner,
  spotifyRefreshAccessToken,
  type SpotifyPlaylistMetaResult,
} from "@/lib/spotify-api";
import { parseSpotifyPlaylistId } from "@/lib/spotify-playlist-id";
import { rateLimitPlaylistAdd } from "@/lib/spotify-rate-limit";
import { headers } from "next/headers";

const TRACK_URI_RE = /^spotify:track:[A-Za-z0-9]+$/;

export type AddTrackResult = { ok: true } | { ok: false; error: string };

export type TrackMeta = {
  uri: string;
  name: string;
  artists: string;
  album: string;
  imageUrl: string | null;
};

export async function addTrackToPlaylist(invitationAccessToken: string, track: TrackMeta): Promise<AddTrackResult> {
  const tok = invitationAccessToken?.trim();
  const uri = track?.uri?.trim();
  if (!tok || !uri || !TRACK_URI_RE.test(uri)) {
    return { ok: false, error: "Solicitud inválida." };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? "unknown";
  if (!rateLimitPlaylistAdd(ip)) {
    return { ok: false, error: "Demasiados intentos. Espera un minuto." };
  }

  const db = await createStrictServiceClient();
  if (!db) {
    return { ok: false, error: "Servicio no disponible." };
  }

  const anon = await createClient();
  const { data: invitado, error: invErr } = await fetchInvitadoWithAcompanantes(anon, tok);
  if (invErr || !invitado?.id || !invitado.evento_id) {
    return { ok: false, error: "Invitación no válida." };
  }

  const creds = await spotifyGetCredentials(db, invitado.evento_id);
  if (!creds?.refresh_token || !creds.playlist_id?.trim()) {
    return { ok: false, error: "La playlist colaborativa no está activa para este evento." };
  }

  const playlistId =
    parseSpotifyPlaylistId(creds.playlist_id) ?? creds.playlist_id.trim();
  if (!playlistId) {
    return { ok: false, error: "El ID de la playlist no es válido. Revisa el enlace en el panel del evento." };
  }

  const refreshed = await spotifyRefreshAccessToken(creds.refresh_token);
  if (!refreshed?.access_token) {
    return { ok: false, error: "No se pudo autorizar con Spotify. Los novios deben volver a conectar." };
  }

  if (!spotifyAccessTokenAllowsPlaylistModify(refreshed.access_token, refreshed.scope)) {
    console.error("[spotify] add track: token sin playlist-modify-*", {
      refresh_scope: refreshed.scope ?? "(omitido)",
      jwt_scopes: spotifyAccessTokenJwtScopes(refreshed.access_token)?.join(" ") ?? "(opaco o sin scp)",
    });
    return {
      ok: false,
      error:
        "Spotify no otorgó permiso para editar playlists con esta conexión. En https://www.spotify.com/account/apps quita el acceso a esta aplicación y, en el panel del evento, vuelve a vincular Spotify aceptando todos los permisos.",
    };
  }

  await spotifyUpdateRefreshTokenIfPresent(db, invitado.evento_id, refreshed.refresh_token);

  // Si la conexión vieja no guardó `spotify_user_id` (p. ej. /me falló al conectar), lo resolvemos
  // ahora con el access token fresco y lo persistimos. Sin esto saltábamos la validación de dueño.
  let spotifyUserId = creds.spotify_user_id?.trim() || null;
  if (!spotifyUserId) {
    const me = await spotifyFetchCurrentUserId(refreshed.access_token, { logFailure: true });
    if (me) {
      spotifyUserId = me;
      await spotifyUpsertRefreshToken(db, invitado.evento_id, creds.refresh_token!, me);
    } else {
      return {
        ok: false,
        error:
          "No pudimos verificar la cuenta de Spotify vinculada. Pídele a quien organiza el evento que vuelva a vincular Spotify desde el panel.",
      };
    }
  }

  const playlistMeta: SpotifyPlaylistMetaResult = await spotifyFetchPlaylistOwner(
    refreshed.access_token,
    playlistId
  );
  if (!playlistMeta.ok) {
    return {
      ok: false,
      error:
        playlistMeta.status === 404
          ? "La playlist del evento ya no existe en Spotify. Pídele a quien organiza que la actualice en el panel."
          : "No pudimos validar la playlist del evento. Pídele a quien organiza que la revise en el panel.",
    };
  }
  const ownerMatches = playlistMeta.ownerId === spotifyUserId;
  if (!ownerMatches) {
    // Spotify ya no permite POST /tracks en playlists colaborativas desde la API si no eres dueño
    // (cambio 2024). Cualquier caso “otro dueño” lo bloqueamos con mensaje accionable.
    return {
      ok: false,
      error:
        "La playlist conectada no pertenece a la cuenta de Spotify vinculada, así que la API no deja añadir canciones. Pídele a quien organiza que entre al panel y use «Crear playlist nueva con mi cuenta» o pegue el enlace de una propia.",
    };
  }

  const added = await spotifyAddTracksToPlaylist(refreshed.access_token, playlistId, [uri]);
  if (!added.ok) {
    if (added.status === 403) {
      console.error("[spotify] add track 403", {
        spotifyMessage: added.spotifyMessage?.slice(0, 300),
        refresh_scope: refreshed.scope ?? "(omitido)",
        jwt_scopes: spotifyAccessTokenJwtScopes(refreshed.access_token)?.join(" ") ?? "(opaco o sin scp)",
        playlistId,
        ownerMatches,
        collaborative: playlistMeta.collaborative,
      });
    }
    let error = mensajeUsuarioSpotifyAddTrack(added.status, added.spotifyMessage);
    if (added.status === 403 && playlistMeta.collaborative) {
      error +=
        " Spotify dejó de permitir añadir desde la API en listas marcadas como colaborativas. Pídele a quien organiza que cree una playlist nueva sin colaboración o use «Crear playlist nueva con mi cuenta» en el panel.";
    }
    return { ok: false, error };
  }

  await playlistInsertAporte(db, {
    evento_id: invitado.evento_id,
    invitado_id: invitado.id,
    track_uri: uri,
    track_name: track.name?.slice(0, 500) ?? null,
    artist_names: track.artists?.slice(0, 500) ?? null,
    album_name: track.album?.slice(0, 500) ?? null,
    image_url: track.imageUrl,
  });

  return { ok: true };
}

/**
 * Añade un track a la playlist del evento usando el refresh_token guardado en servidor.
 * Preferible pasar `meta` si viene de la búsqueda (aportes y “últimos pedidos” con detalle).
 */
export async function addTrackToSpotify(
  invitationAccessToken: string,
  trackUri: string,
  meta?: Partial<TrackMeta>
): Promise<AddTrackResult> {
  const uri = trackUri?.trim() ?? "";
  if (!TRACK_URI_RE.test(uri)) {
    return { ok: false, error: "URI de canción inválida." };
  }
  return addTrackToPlaylist(invitationAccessToken, {
    uri,
    name: meta?.name ?? "Canción",
    artists: meta?.artists ?? "",
    album: meta?.album ?? "",
    imageUrl: meta?.imageUrl ?? null,
  });
}

export type ApoyarResult = { ok: true; already?: boolean } | { ok: false; error: string };

/**
 * Apoyo sin tocar Spotify: suma preferencia a una canción que ya figuró como aporte.
 */
export async function apoyarTrackEnPlaylist(invitationAccessToken: string, trackUri: string): Promise<ApoyarResult> {
  const tok = invitationAccessToken?.trim();
  const uri = trackUri?.trim();
  if (!tok || !uri || !TRACK_URI_RE.test(uri)) {
    return { ok: false, error: "Solicitud inválida." };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? "unknown";
  if (!rateLimitPlaylistAdd(ip)) {
    return { ok: false, error: "Demasiados intentos. Espera un minuto." };
  }

  const db = await createStrictServiceClient();
  if (!db) {
    return { ok: false, error: "Servicio no disponible." };
  }

  const anon = await createClient();
  const { data: invitado, error: invErr } = await fetchInvitadoWithAcompanantes(anon, tok);
  if (invErr || !invitado?.id || !invitado.evento_id) {
    return { ok: false, error: "Invitación no válida." };
  }

  const creds = await spotifyGetCredentials(db, invitado.evento_id);
  if (!creds?.refresh_token || !creds.playlist_id) {
    return { ok: false, error: "La playlist colaborativa no está activa para este evento." };
  }

  const existe = await playlistHayAporteParaTrack(db, invitado.evento_id, uri);
  if (!existe) {
    return { ok: false, error: "Primero tiene que estar propuesta en la playlist (búsqueda y Añadir)." };
  }

  const ins = await playlistInsertApoyo(db, invitado.evento_id, invitado.id, uri);
  if (!ins.ok) {
    return { ok: false, error: ins.error };
  }
  return { ok: true, already: ins.already };
}
