"use server";

import { createClient, createStrictServiceClient } from "@/lib/supabase/server";
import { fetchInvitadoWithAcompanantes } from "@/lib/invitado-fetch";
import {
  playlistInsertAporte,
  spotifyGetCredentials,
  spotifyUpdateRefreshTokenIfPresent,
} from "@/lib/spotify-credentials";
import {
  spotifyAddTracksToPlaylist,
  spotifyFetchPlaylistOwner,
  spotifyRefreshAccessToken,
} from "@/lib/spotify-api";
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
  if (!creds?.refresh_token || !creds.playlist_id) {
    return { ok: false, error: "La playlist colaborativa no está activa para este evento." };
  }

  const refreshed = await spotifyRefreshAccessToken(creds.refresh_token);
  if (!refreshed?.access_token) {
    return { ok: false, error: "No se pudo autorizar con Spotify. Los novios deben volver a conectar." };
  }

  await spotifyUpdateRefreshTokenIfPresent(db, invitado.evento_id, refreshed.refresh_token);

  if (creds.spotify_user_id) {
    const playlistMeta = await spotifyFetchPlaylistOwner(refreshed.access_token, creds.playlist_id);
    if (!playlistMeta || playlistMeta.ownerId !== creds.spotify_user_id) {
      return {
        ok: false,
        error:
          "La playlist del evento no coincide con la cuenta de Spotify vinculada. Los novios deben revisar la configuración en el panel.",
      };
    }
  }

  const added = await spotifyAddTracksToPlaylist(refreshed.access_token, creds.playlist_id, [uri]);
  if (!added) {
    return { ok: false, error: "Spotify no pudo añadir la canción (¿playlist y permisos correctos?)." };
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
