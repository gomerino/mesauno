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

export async function spotifyUpsertRefreshToken(
  db: SupabaseClient,
  eventoId: string,
  refreshToken: string,
  spotifyUserId?: string | null
): Promise<boolean> {
  const { data: existing } = await db.from("evento_spotify").select("playlist_id").eq("evento_id", eventoId).maybeSingle();
  const { error } = await db.from("evento_spotify").upsert(
    {
      evento_id: eventoId,
      refresh_token: refreshToken,
      spotify_user_id: spotifyUserId ?? null,
      playlist_id: (existing as { playlist_id?: string | null } | null)?.playlist_id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "evento_id" }
  );
  if (error) {
    console.error("[spotify] upsert token", error.message);
    return false;
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
