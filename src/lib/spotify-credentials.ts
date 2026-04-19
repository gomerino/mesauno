import type { SupabaseClient } from "@supabase/supabase-js";

export type EventoSpotifyRow = {
  evento_id: string;
  refresh_token: string | null;
  playlist_id: string | null;
  spotify_user_id: string | null;
  updated_at: string;
};

export async function spotifyGetCredentials(
  db: SupabaseClient,
  eventoId: string
): Promise<EventoSpotifyRow | null> {
  const { data, error } = await db.from("evento_spotify").select("*").eq("evento_id", eventoId).maybeSingle();
  if (error) {
    console.error("[spotify] get credentials", error.message);
    return null;
  }
  return data as EventoSpotifyRow | null;
}

/** Solo servidor (p. ej. service_role). No serializar `refresh_token` al cliente. */
export type SpotifyPanelPublicState = {
  connected: boolean;
  playlistId: string | null;
};

export async function spotifyGetPanelPublicState(
  db: SupabaseClient,
  eventoId: string
): Promise<SpotifyPanelPublicState> {
  const { data, error } = await db
    .from("evento_spotify")
    .select("playlist_id, refresh_token")
    .eq("evento_id", eventoId)
    .maybeSingle();
  if (error || !data) {
    return { connected: false, playlistId: null };
  }
  const row = data as Pick<EventoSpotifyRow, "playlist_id" | "refresh_token">;
  return {
    connected: Boolean(row.refresh_token?.trim()),
    playlistId: row.playlist_id?.trim() || null,
  };
}

export async function spotifyUpsertRefreshToken(
  db: SupabaseClient,
  eventoId: string,
  refreshToken: string,
  spotifyUserId?: string | null
): Promise<boolean> {
  const { data: existing, error: selErr } = await db
    .from("evento_spotify")
    .select("playlist_id, spotify_user_id")
    .eq("evento_id", eventoId)
    .maybeSingle();

  if (selErr) {
    console.error("[spotify] select antes de upsert", selErr.message);
    return false;
  }

  /** Id resuelto en esta ronda OAuth (GET /me). */
  const resolved =
    spotifyUserId != null && String(spotifyUserId).trim() !== "" ? String(spotifyUserId).trim() : null;

  /**
   * Si /me falló en un reintento, no pisar un `spotify_user_id` ya guardado con null.
   * Si esta ronda devolvió id, usarlo.
   */
  const mergedUserId =
    resolved ?? (existing as { spotify_user_id?: string | null } | null)?.spotify_user_id?.trim() ?? null;

  const { error } = await db.from("evento_spotify").upsert(
    {
      evento_id: eventoId,
      refresh_token: refreshToken,
      spotify_user_id: mergedUserId,
      playlist_id: (existing as { playlist_id?: string | null } | null)?.playlist_id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "evento_id" }
  );
  if (error) {
    console.error("[spotify] upsert token", error.message);
    return false;
  }

  // Refuerzo: PostgREST a veces no persiste bien columnas opcionales en upsert; aseguramos el id si lo tenemos.
  if (resolved) {
    const { error: uErr, data: after } = await db
      .from("evento_spotify")
      .update({ spotify_user_id: resolved, updated_at: new Date().toISOString() })
      .eq("evento_id", eventoId)
      .select("spotify_user_id")
      .maybeSingle();
    if (uErr) {
      console.error("[spotify] update spotify_user_id tras OAuth", uErr.message);
      return false;
    }
    if (after?.spotify_user_id !== resolved) {
      console.error("[spotify] spotify_user_id no coincide tras update", { expected: resolved, got: after?.spotify_user_id });
      return false;
    }
  }

  return true;
}

export async function spotifyUpdatePlaylistId(
  db: SupabaseClient,
  eventoId: string,
  playlistId: string | null
): Promise<{ ok: boolean; error?: string }> {
  const { data: row } = await db.from("evento_spotify").select("evento_id").eq("evento_id", eventoId).maybeSingle();
  if (!row) {
    return { ok: false, error: "Primero conecta tu cuenta de Spotify." };
  }
  const { error } = await db
    .from("evento_spotify")
    .update({ playlist_id: playlistId, updated_at: new Date().toISOString() })
    .eq("evento_id", eventoId);
  if (error) {
    console.error("[spotify] update playlist id", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function spotifyUpdateRefreshTokenIfPresent(
  db: SupabaseClient,
  eventoId: string,
  newRefreshToken: string | null | undefined
) {
  if (!newRefreshToken) return;
  const { error } = await db
    .from("evento_spotify")
    .update({ refresh_token: newRefreshToken, updated_at: new Date().toISOString() })
    .eq("evento_id", eventoId);
  if (error) console.error("[spotify] rotate refresh", error.message);
}

export type PlaylistAporteRow = {
  id: string;
  evento_id: string;
  invitado_id: string;
  track_uri: string;
  track_name: string | null;
  artist_names: string | null;
  album_name: string | null;
  image_url: string | null;
  created_at: string;
};

export async function playlistInsertAporte(
  db: SupabaseClient,
  row: Omit<PlaylistAporteRow, "id" | "created_at">
): Promise<boolean> {
  const { error } = await db.from("playlist_aportes").insert({
    evento_id: row.evento_id,
    invitado_id: row.invitado_id,
    track_uri: row.track_uri,
    track_name: row.track_name,
    artist_names: row.artist_names,
    album_name: row.album_name,
    image_url: row.image_url,
  });
  if (error) {
    console.error("[playlist_aportes] insert", error.message);
    return false;
  }
  return true;
}

export async function playlistListRecent(
  db: SupabaseClient,
  eventoId: string,
  limit: number
): Promise<PlaylistAporteRow[]> {
  const { data, error } = await db
    .from("playlist_aportes")
    .select("*")
    .eq("evento_id", eventoId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[playlist_aportes] list", error.message);
    return [];
  }
  return (data ?? []) as PlaylistAporteRow[];
}

export type PlaylistAportePublic = {
  track_name: string | null;
  artist_names: string | null;
  album_name: string | null;
  image_url: string | null;
  created_at: string;
  guest_first_name: string;
};

export async function playlistListRecentPublic(
  db: SupabaseClient,
  eventoId: string,
  limit: number
): Promise<PlaylistAportePublic[]> {
  const { data, error } = await db
    .from("playlist_aportes")
    .select("track_name, artist_names, album_name, image_url, created_at, invitados(nombre_pasajero)")
    .eq("evento_id", eventoId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn("[playlist_aportes] join invitados fallback", error.message);
    const rows = await playlistListRecent(db, eventoId, limit);
    return rows.map((r) => ({
      track_name: r.track_name,
      artist_names: r.artist_names,
      album_name: r.album_name,
      image_url: r.image_url,
      created_at: r.created_at,
      guest_first_name: "Invitado",
    }));
  }
  type Row = {
    track_name: string | null;
    artist_names: string | null;
    album_name: string | null;
    image_url: string | null;
    created_at: string;
    invitados: { nombre_pasajero: string | null } | { nombre_pasajero: string | null }[] | null;
  };
  return (data ?? []).map((raw: Row) => {
    const inv = raw.invitados;
    const nombre = Array.isArray(inv) ? inv[0]?.nombre_pasajero : inv?.nombre_pasajero;
    const first = nombre?.trim().split(/\s+/)[0] || "Un invitado";
    return {
      track_name: raw.track_name,
      artist_names: raw.artist_names,
      album_name: raw.album_name,
      image_url: raw.image_url,
      created_at: raw.created_at,
      guest_first_name: first,
    };
  });
}

export type PlaylistTopPublic = {
  track_uri: string;
  personas: number;
  track_name: string | null;
  artist_names: string | null;
  album_name: string | null;
  image_url: string | null;
};

export async function playlistListTopPublic(
  db: SupabaseClient,
  eventoId: string,
  limit: number
): Promise<PlaylistTopPublic[]> {
  const { data: aportesRaw, error: aErr } = await db
    .from("playlist_aportes")
    .select("track_uri, invitado_id, track_name, artist_names, album_name, image_url, created_at")
    .eq("evento_id", eventoId);
  if (aErr) {
    console.error("[playlist ranking] aportes", aErr.message);
    return [];
  }
  const { data: apoyosRaw, error: oErr } = await db.from("playlist_apoyos").select("track_uri, invitado_id").eq("evento_id", eventoId);
  if (oErr) {
    console.warn("[playlist ranking] apoyos", oErr.message);
  }
  type AporteR = {
    track_uri: string;
    invitado_id: string;
    track_name: string | null;
    artist_names: string | null;
    album_name: string | null;
    image_url: string | null;
    created_at: string;
  };
  const aportes = (aportesRaw ?? []) as AporteR[];
  const apoyos = (apoyosRaw ?? []) as Array<{ track_uri: string; invitado_id: string }>;

  const byTrack = new Map<
    string,
    {
      voters: Set<string>;
      meta: {
        track_name: string | null;
        artist_names: string | null;
        album_name: string | null;
        image_url: string | null;
        t: number;
      } | null;
    }
  >();

  for (const a of aportes) {
    const uri = a.track_uri;
    if (!byTrack.has(uri)) {
      byTrack.set(uri, { voters: new Set(), meta: null });
    }
    const entry = byTrack.get(uri)!;
    entry.voters.add(a.invitado_id);
    const ts = new Date(a.created_at).getTime();
    if (!entry.meta || ts >= entry.meta.t) {
      entry.meta = {
        track_name: a.track_name,
        artist_names: a.artist_names,
        album_name: a.album_name,
        image_url: a.image_url,
        t: ts,
      };
    }
  }
  for (const o of apoyos) {
    if (!byTrack.has(o.track_uri)) {
      byTrack.set(o.track_uri, { voters: new Set(), meta: null });
    }
    byTrack.get(o.track_uri)!.voters.add(o.invitado_id);
  }

  const rows: PlaylistTopPublic[] = [];
  byTrack.forEach(({ voters, meta }, track_uri) => {
    if (voters.size === 0) return;
    rows.push({
      track_uri,
      personas: voters.size,
      track_name: meta?.track_name ?? null,
      artist_names: meta?.artist_names ?? null,
      album_name: meta?.album_name ?? null,
      image_url: meta?.image_url ?? null,
    });
  });
  rows.sort((a, b) => b.personas - a.personas || (a.track_name ?? "").localeCompare(b.track_name ?? ""));
  return rows.slice(0, limit);
}

export async function playlistInvitadoApoyoUris(
  db: SupabaseClient,
  eventoId: string,
  invitadoId: string
): Promise<Set<string>> {
  const { data, error } = await db
    .from("playlist_apoyos")
    .select("track_uri")
    .eq("evento_id", eventoId)
    .eq("invitado_id", invitadoId);
  if (error) {
    console.error("[playlist_apoyos] list uris", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((r: { track_uri: string }) => r.track_uri));
}

export async function playlistHayAporteParaTrack(
  db: SupabaseClient,
  eventoId: string,
  trackUri: string
): Promise<boolean> {
  const { data, error } = await db
    .from("playlist_aportes")
    .select("id")
    .eq("evento_id", eventoId)
    .eq("track_uri", trackUri)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[playlist_aportes] exists", error.message);
    return false;
  }
  return Boolean(data);
}

export async function playlistInsertApoyo(
  db: SupabaseClient,
  eventoId: string,
  invitadoId: string,
  trackUri: string
): Promise<{ ok: true; already?: boolean } | { ok: false; error: string }> {
  const { error } = await db.from("playlist_apoyos").insert({
    evento_id: eventoId,
    invitado_id: invitadoId,
    track_uri: trackUri,
  });
  if (error) {
    if (error.code === "23505") {
      return { ok: true, already: true };
    }
    console.error("[playlist_apoyos] insert", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
