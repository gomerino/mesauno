import type { SupabaseClient } from "@supabase/supabase-js";
import { musicaUsuarioEsAdminEvento } from "@/lib/musica-colaborativa";
import { syncToSpotify } from "@/lib/spotify-dj-sync";
import { randomBytes, timingSafeEqual } from "crypto";

export const MUSICA_DJ_DURACION_DEFAULT_SEG = 180;

export type PlaylistEventoDjCampos = {
  dj_aporte_actual_id: string | null;
  dj_reproduciendo: boolean;
  dj_inicio_reproduccion_at: string | null;
  dj_segundos_acumulados: number;
  dj_auto: boolean;
  dj_sincronizar_cola_con_votos: boolean;
  dj_token_acceso: string | null;
};

export type MusicaDjNivelAcceso = "admin" | "dj_token";

export async function musicaDjResolverAcceso(
  db: SupabaseClient,
  eventoId: string,
  opts: { userId: string | null; dj_token: string | null }
): Promise<MusicaDjNivelAcceso | null> {
  if (opts.userId) {
    const admin = await musicaUsuarioEsAdminEvento(db, opts.userId, eventoId);
    if (admin) return "admin";
  }
  const token = opts.dj_token?.trim() ?? "";
  if (!token) return null;
  const campos = await musicaDjLeerCampos(db, eventoId);
  if (!campos?.dj_token_acceso) return null;
  return musicaDjTokensCoinciden(campos.dj_token_acceso, token) ? "dj_token" : null;
}

export async function musicaDjEnsurePlaylistRow(db: SupabaseClient, eventoId: string): Promise<void> {
  const { data } = await db.from("playlists_evento").select("id").eq("evento_id", eventoId).maybeSingle();
  if (data?.id) return;
  await db.from("playlists_evento").insert({
    evento_id: eventoId,
    estado: "conectada",
    spotify_playlist_id: null,
  });
}

export async function musicaDjLeerCampos(db: SupabaseClient, eventoId: string): Promise<PlaylistEventoDjCampos | null> {
  const { data, error } = await db
    .from("playlists_evento")
    .select(
      "dj_aporte_actual_id, dj_reproduciendo, dj_inicio_reproduccion_at, dj_segundos_acumulados, dj_auto, dj_sincronizar_cola_con_votos, dj_token_acceso"
    )
    .eq("evento_id", eventoId)
    .maybeSingle();
  if (error || !data) return null;
  const r = data as Record<string, unknown>;
  return {
    dj_aporte_actual_id: (r.dj_aporte_actual_id as string | null) ?? null,
    dj_reproduciendo: Boolean(r.dj_reproduciendo),
    dj_inicio_reproduccion_at: (r.dj_inicio_reproduccion_at as string | null) ?? null,
    dj_segundos_acumulados: Number(r.dj_segundos_acumulados ?? 0),
    dj_auto: Boolean(r.dj_auto),
    dj_sincronizar_cola_con_votos: r.dj_sincronizar_cola_con_votos !== false,
    dj_token_acceso: (r.dj_token_acceso as string | null) ?? null,
  };
}

export function musicaDjSegundosTranscurridos(campos: PlaylistEventoDjCampos): number {
  const base = Math.max(0, campos.dj_segundos_acumulados);
  if (!campos.dj_reproduciendo || !campos.dj_inicio_reproduccion_at) return base;
  const start = Date.parse(campos.dj_inicio_reproduccion_at);
  if (Number.isNaN(start)) return base;
  const delta = Math.floor((Date.now() - start) / 1000);
  return base + Math.max(0, delta);
}

export function musicaDjDuracionSegundosDesdeMs(duracion_ms: number | null | undefined): number {
  if (typeof duracion_ms === "number" && duracion_ms > 0) {
    return Math.max(15, Math.round(duracion_ms / 1000));
  }
  return MUSICA_DJ_DURACION_DEFAULT_SEG;
}

export function musicaDjTokensCoinciden(almacenado: string | null | undefined, provisto: string): boolean {
  const a = (almacenado ?? "").trim();
  const b = provisto.trim();
  if (!a || !b || a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

async function djRenumerarCola(db: SupabaseClient, eventoId: string): Promise<void> {
  const { data: rows, error } = await db
    .from("aportes_canciones")
    .select("id")
    .eq("evento_id", eventoId)
    .eq("estado", "aprobado")
    .eq("en_cola", true)
    .order("orden_cola", { ascending: true, nullsFirst: false });
  if (error || !rows?.length) return;
  for (let i = 0; i < rows.length; i++) {
    await db.from("aportes_canciones").update({ orden_cola: i + 1 }).eq("id", rows[i].id).eq("evento_id", eventoId);
  }
}

async function djActualizarPlaylist(
  db: SupabaseClient,
  eventoId: string,
  patch: Record<string, unknown>
): Promise<boolean> {
  await musicaDjEnsurePlaylistRow(db, eventoId);
  const { error } = await db.from("playlists_evento").update(patch).eq("evento_id", eventoId);
  if (error) {
    console.error("[musica-dj] update playlist", error.message);
    return false;
  }
  return true;
}

export async function musicaDjReproducir(db: SupabaseClient, eventoId: string): Promise<boolean> {
  await musicaDjEnsurePlaylistRow(db, eventoId);
  const campos = await musicaDjLeerCampos(db, eventoId);
  if (!campos) return false;

  const ahoraIso = new Date().toISOString();

  if (campos.dj_aporte_actual_id) {
    if (campos.dj_reproduciendo) return true;
    const ok = await djActualizarPlaylist(db, eventoId, {
      dj_reproduciendo: true,
      dj_inicio_reproduccion_at: ahoraIso,
    });
    if (ok) void syncToSpotify({ evento_id: eventoId });
    return ok;
  }

  const { data: head, error } = await db
    .from("aportes_canciones")
    .select("id")
    .eq("evento_id", eventoId)
    .eq("estado", "aprobado")
    .eq("en_cola", true)
    .order("orden_cola", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error || !head?.id) return false;

  await db
    .from("aportes_canciones")
    .update({ en_cola: false, orden_cola: null })
    .eq("id", head.id)
    .eq("evento_id", eventoId);

  await djRenumerarCola(db, eventoId);

  const ok = await djActualizarPlaylist(db, eventoId, {
    dj_aporte_actual_id: head.id,
    dj_reproduciendo: true,
    dj_inicio_reproduccion_at: ahoraIso,
    dj_segundos_acumulados: 0,
  });
  if (ok) void syncToSpotify({ evento_id: eventoId });
  return ok;
}

export async function musicaDjPausar(db: SupabaseClient, eventoId: string): Promise<boolean> {
  const campos = await musicaDjLeerCampos(db, eventoId);
  if (!campos?.dj_aporte_actual_id || !campos.dj_reproduciendo) {
    return await djActualizarPlaylist(db, eventoId, { dj_reproduciendo: false, dj_inicio_reproduccion_at: null });
  }

  const total = musicaDjSegundosTranscurridos(campos);
  const ok = await djActualizarPlaylist(db, eventoId, {
    dj_reproduciendo: false,
    dj_inicio_reproduccion_at: null,
    dj_segundos_acumulados: total,
  });
  if (ok) void syncToSpotify({ evento_id: eventoId });
  return ok;
}

export async function musicaDjSiguiente(db: SupabaseClient, eventoId: string): Promise<boolean> {
  await musicaDjEnsurePlaylistRow(db, eventoId);
  const campos = await musicaDjLeerCampos(db, eventoId);
  const seguirSonando = Boolean(campos?.dj_reproduciendo);
  const cur = campos?.dj_aporte_actual_id ?? null;

  if (cur) {
    await db
      .from("aportes_canciones")
      .update({ reproducida: true, en_cola: false, orden_cola: null })
      .eq("id", cur)
      .eq("evento_id", eventoId)
      .eq("estado", "aprobado");
  }

  const { data: next, error } = await db
    .from("aportes_canciones")
    .select("id")
    .eq("evento_id", eventoId)
    .eq("estado", "aprobado")
    .eq("en_cola", true)
    .order("orden_cola", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const ahoraIso = new Date().toISOString();

  if (error || !next?.id) {
    const ok = await djActualizarPlaylist(db, eventoId, {
      dj_aporte_actual_id: null,
      dj_reproduciendo: false,
      dj_inicio_reproduccion_at: null,
      dj_segundos_acumulados: 0,
    });
    if (ok) void syncToSpotify({ evento_id: eventoId });
    return ok;
  }

  await db
    .from("aportes_canciones")
    .update({ en_cola: false, orden_cola: null })
    .eq("id", next.id)
    .eq("evento_id", eventoId);

  await djRenumerarCola(db, eventoId);

  const ok = await djActualizarPlaylist(db, eventoId, {
    dj_aporte_actual_id: next.id,
    dj_segundos_acumulados: 0,
    dj_reproduciendo: seguirSonando,
    dj_inicio_reproduccion_at: seguirSonando ? ahoraIso : null,
  });
  if (ok) void syncToSpotify({ evento_id: eventoId });
  return ok;
}

export async function musicaDjToggleAuto(db: SupabaseClient, eventoId: string, activo: boolean): Promise<boolean> {
  await musicaDjEnsurePlaylistRow(db, eventoId);
  return djActualizarPlaylist(db, eventoId, { dj_auto: activo });
}

export async function musicaDjSetSincronizarColaConVotos(
  db: SupabaseClient,
  eventoId: string,
  sincronizar: boolean
): Promise<boolean> {
  await musicaDjEnsurePlaylistRow(db, eventoId);
  return djActualizarPlaylist(db, eventoId, { dj_sincronizar_cola_con_votos: sincronizar });
}

export async function musicaDjRegenerarToken(db: SupabaseClient, eventoId: string): Promise<string | null> {
  await musicaDjEnsurePlaylistRow(db, eventoId);
  const token = randomBytes(24).toString("hex");
  const ok = await djActualizarPlaylist(db, eventoId, { dj_token_acceso: token });
  return ok ? token : null;
}

export async function musicaDjColaAgregar(db: SupabaseClient, eventoId: string, aporteId: string): Promise<boolean> {
  const { data: ap, error: e1 } = await db
    .from("aportes_canciones")
    .select("id, estado, reproducida, en_cola")
    .eq("id", aporteId)
    .eq("evento_id", eventoId)
    .maybeSingle();
  if (e1 || !ap || ap.estado !== "aprobado") return false;
  if (Boolean(ap.reproducida)) return false;
  if (Boolean(ap.en_cola)) return true;

  const { data: maxRow } = await db
    .from("aportes_canciones")
    .select("orden_cola")
    .eq("evento_id", eventoId)
    .eq("en_cola", true)
    .order("orden_cola", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const siguienteOrden = typeof maxRow?.orden_cola === "number" ? maxRow.orden_cola + 1 : 1;
  const { error } = await db
    .from("aportes_canciones")
    .update({ en_cola: true, orden_cola: siguienteOrden })
    .eq("id", aporteId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("[musica-dj] cola agregar", error.message);
    return false;
  }
  await djRenumerarCola(db, eventoId);
  void syncToSpotify({ evento_id: eventoId });
  return true;
}

export async function musicaDjColaQuitar(db: SupabaseClient, eventoId: string, aporteId: string): Promise<boolean> {
  const { error } = await db
    .from("aportes_canciones")
    .update({ en_cola: false, orden_cola: null })
    .eq("id", aporteId)
    .eq("evento_id", eventoId)
    .eq("en_cola", true);
  if (error) {
    console.error("[musica-dj] cola quitar", error.message);
    return false;
  }
  await djRenumerarCola(db, eventoId);
  void syncToSpotify({ evento_id: eventoId });
  return true;
}

export async function musicaDjColaMover(
  db: SupabaseClient,
  eventoId: string,
  aporteId: string,
  direccion: "arriba" | "abajo"
): Promise<boolean> {
  const { data: rows, error } = await db
    .from("aportes_canciones")
    .select("id, orden_cola")
    .eq("evento_id", eventoId)
    .eq("estado", "aprobado")
    .eq("en_cola", true)
    .order("orden_cola", { ascending: true, nullsFirst: false });
  if (error || !rows?.length) return false;

  const idx = rows.findIndex((r) => r.id === aporteId);
  if (idx < 0) return false;
  const swapWith = direccion === "arriba" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= rows.length) return true;

  const a = rows[idx];
  const b = rows[swapWith];
  const oa = a.orden_cola ?? idx + 1;
  const ob = b.orden_cola ?? swapWith + 1;

  await db.from("aportes_canciones").update({ orden_cola: ob }).eq("id", a.id).eq("evento_id", eventoId);
  await db.from("aportes_canciones").update({ orden_cola: oa }).eq("id", b.id).eq("evento_id", eventoId);
  await djRenumerarCola(db, eventoId);
  void syncToSpotify({ evento_id: eventoId });
  return true;
}
