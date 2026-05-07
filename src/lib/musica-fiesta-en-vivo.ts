import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MUSICA_DJ_DURACION_DEFAULT_SEG,
  musicaDjDuracionSegundosDesdeMs,
  musicaDjSegundosTranscurridos,
  type PlaylistEventoDjCampos,
} from "@/lib/musica-modo-dj";

export const MUSICA_FIESTA_COLA_MAX = 10;
export const MUSICA_FIESTA_SIGUIENTES_UI = 3;

function playlistRowADjCampos(plRow: Record<string, unknown> | null): PlaylistEventoDjCampos {
  if (!plRow) {
    return {
      dj_aporte_actual_id: null,
      dj_reproduciendo: false,
      dj_inicio_reproduccion_at: null,
      dj_segundos_acumulados: 0,
      dj_auto: false,
      dj_sincronizar_cola_con_votos: true,
      dj_token_acceso: null,
    };
  }
  return {
    dj_aporte_actual_id: (plRow.dj_aporte_actual_id as string | null) ?? null,
    dj_reproduciendo: Boolean(plRow.dj_reproduciendo),
    dj_inicio_reproduccion_at: (plRow.dj_inicio_reproduccion_at as string | null) ?? null,
    dj_segundos_acumulados: Number(plRow.dj_segundos_acumulados ?? 0),
    dj_auto: Boolean(plRow.dj_auto),
    dj_sincronizar_cola_con_votos: plRow.dj_sincronizar_cola_con_votos !== false,
    dj_token_acceso: (plRow.dj_token_acceso as string | null) ?? null,
  };
}

export type MusicaFiestaItemEnriquecido = {
  aporte_id: string;
  titulo: string;
  artista: string;
  votos: number;
  votos_live: number;
  orden_cola: number | null;
  en_cola: boolean;
  reproducida: boolean;
  ya_voto_live: boolean;
};

export async function musicaFiestaLeerModoActivo(db: SupabaseClient, eventoId: string): Promise<boolean> {
  const { data, error } = await db
    .from("playlists_evento")
    .select("modo_fiesta_activo")
    .eq("evento_id", eventoId)
    .maybeSingle();
  if (error || !data) return false;
  return Boolean((data as { modo_fiesta_activo?: boolean }).modo_fiesta_activo);
}

export async function musicaFiestaActivar(db: SupabaseClient, eventoId: string): Promise<boolean> {
  const { data: existe } = await db.from("playlists_evento").select("id").eq("evento_id", eventoId).maybeSingle();
  let error = null as { message: string } | null;
  if (existe) {
    const u = await db.from("playlists_evento").update({ modo_fiesta_activo: true }).eq("evento_id", eventoId);
    error = u.error;
  } else {
    const ins = await db.from("playlists_evento").insert({
      evento_id: eventoId,
      estado: "conectada",
      spotify_playlist_id: null,
      modo_fiesta_activo: true,
    });
    error = ins.error;
  }
  if (error) {
    console.error("[musica-fiesta] activar", error.message);
    return false;
  }
  await musicaFiestaRecalcularCola(db, eventoId);
  return true;
}

export async function musicaFiestaDesactivar(db: SupabaseClient, eventoId: string): Promise<boolean> {
  const { error } = await db
    .from("playlists_evento")
    .update({ modo_fiesta_activo: false })
    .eq("evento_id", eventoId);
  if (error) {
    console.error("[musica-fiesta] desactivar", error.message);
    return false;
  }
  await db
    .from("aportes_canciones")
    .update({ en_cola: false, orden_cola: null })
    .eq("evento_id", eventoId)
    .eq("estado", "aprobado");
  return true;
}

export async function musicaFiestaRecalcularCola(db: SupabaseClient, eventoId: string): Promise<void> {
  const activo = await musicaFiestaLeerModoActivo(db, eventoId);
  if (!activo) return;

  await db
    .from("aportes_canciones")
    .update({ en_cola: false, orden_cola: null })
    .eq("evento_id", eventoId)
    .eq("estado", "aprobado");

  const { data: candidatos, error } = await db
    .from("aportes_canciones")
    .select("id, votos_live, votos, created_at")
    .eq("evento_id", eventoId)
    .eq("estado", "aprobado")
    .eq("reproducida", false)
    .order("votos_live", { ascending: false })
    .order("votos", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(MUSICA_FIESTA_COLA_MAX);

  if (error) {
    console.error("[musica-fiesta] recalc candidatos", error.message);
    return;
  }

  const ids = (candidatos ?? []) as Array<{ id: string }>;
  for (let i = 0; i < ids.length; i++) {
    await db
      .from("aportes_canciones")
      .update({ en_cola: true, orden_cola: i + 1 })
      .eq("id", ids[i].id)
      .eq("evento_id", eventoId);
  }
}

export type MusicaFiestaRegistrarVotoLiveResult =
  | { ok: true; votos_live: number; ya_votado?: boolean }
  | { ok: false; code: string };

export async function musicaFiestaRegistrarVotoLive(
  db: SupabaseClient,
  input: {
    evento_id: string;
    aporte_id: string;
    invitado_id?: string | null;
    usuario_id?: string | null;
  }
): Promise<MusicaFiestaRegistrarVotoLiveResult> {
  const activo = await musicaFiestaLeerModoActivo(db, input.evento_id);
  if (!activo) return { ok: false, code: "fiesta_inactiva" };

  const inv = input.invitado_id?.trim() || null;
  const usr = input.usuario_id?.trim() || null;
  if ((!inv && !usr) || (Boolean(inv) && Boolean(usr))) return { ok: false, code: "identidad" };

  const { data: ap, error: eAp } = await db
    .from("aportes_canciones")
    .select("id, estado, evento_id")
    .eq("id", input.aporte_id)
    .eq("evento_id", input.evento_id)
    .maybeSingle();
  if (eAp || !ap) return { ok: false, code: "aporte" };
  if (ap.estado !== "aprobado") return { ok: false, code: "no_aprobado" };

  const row =
    inv != null && inv !== ""
      ? { aporte_id: input.aporte_id, invitado_id: inv, usuario_id: null as string | null }
      : { aporte_id: input.aporte_id, usuario_id: usr!, invitado_id: null as string | null };

  const { error: insErr } = await db.from("votos_en_vivo").insert(row);
  if (insErr) {
    if (insErr.code === "23505") {
      const { data: v } = await db
        .from("aportes_canciones")
        .select("votos_live")
        .eq("id", input.aporte_id)
        .maybeSingle();
      return {
        ok: true,
        votos_live: typeof v?.votos_live === "number" ? v.votos_live : 0,
        ya_votado: true,
      };
    }
    console.error("[musica-fiesta] insert voto live", insErr.message);
    return { ok: false, code: "insert" };
  }

  if (await musicaFiestaDebeSincronizarColaAutomatica(db, input.evento_id)) {
    await musicaFiestaRecalcularCola(db, input.evento_id);
  }

  const { data: v2 } = await db.from("aportes_canciones").select("votos_live").eq("id", input.aporte_id).maybeSingle();
  return { ok: true, votos_live: typeof v2?.votos_live === "number" ? v2.votos_live : 0 };
}

export async function musicaFiestaMarcarReproducida(
  db: SupabaseClient,
  eventoId: string,
  aporteId: string
): Promise<boolean> {
  const { error } = await db
    .from("aportes_canciones")
    .update({ reproducida: true, en_cola: false, orden_cola: null })
    .eq("id", aporteId)
    .eq("evento_id", eventoId)
    .eq("estado", "aprobado");
  if (error) {
    console.error("[musica-fiesta] marcar reproducida", error.message);
    return false;
  }
  if (await musicaFiestaDebeSincronizarColaAutomatica(db, eventoId)) {
    await musicaFiestaRecalcularCola(db, eventoId);
  }
  return true;
}

export async function musicaFiestaDebeSincronizarColaAutomatica(
  db: SupabaseClient,
  eventoId: string
): Promise<boolean> {
  const { data } = await db
    .from("playlists_evento")
    .select("dj_sincronizar_cola_con_votos")
    .eq("evento_id", eventoId)
    .maybeSingle();
  if (!data) return true;
  return (data as { dj_sincronizar_cola_con_votos?: boolean }).dj_sincronizar_cola_con_votos !== false;
}

export async function musicaFiestaEstadoDetalle(
  db: SupabaseClient,
  eventoId: string,
  contextoVoto?: { invitado_id: string } | { usuario_id: string }
): Promise<{
  modo_fiesta_activo: boolean;
  en_reproduccion: {
    aporte_id: string;
    titulo: string;
    artista: string;
    imagen: string | null;
    progreso_mock: number;
    duracion_segundos?: number;
    segundos_transcurridos?: number;
    reproduciendo?: boolean;
  } | null;
  siguientes: Array<{ aporte_id: string; titulo: string; artista: string; orden_cola: number }>;
  ranking_en_vivo: MusicaFiestaItemEnriquecido[];
  cola: Array<{
    aporte_id: string;
    titulo: string;
    artista: string;
    orden_cola: number;
    votos: number;
    votos_live: number;
  }>;
  dj_estado: {
    auto: boolean;
    sincronizar_cola_con_votos: boolean;
    reproduciendo: boolean;
    segundos_transcurridos: number;
    duracion_segundos: number;
  } | null;
}> {
  const modo_fiesta_activo = await musicaFiestaLeerModoActivo(db, eventoId);
  if (!modo_fiesta_activo) {
    return {
      modo_fiesta_activo: false,
      en_reproduccion: null,
      siguientes: [],
      ranking_en_vivo: [],
      cola: [],
      dj_estado: null,
    };
  }

  const { data: aportes, error: e1 } = await db
    .from("aportes_canciones")
    .select(
      "id, estado, cancion_id, votos, votos_live, en_cola, orden_cola, reproducida, created_at"
    )
    .eq("evento_id", eventoId)
    .eq("estado", "aprobado");

  if (e1 || !aportes?.length) {
    const { data: plSolo } = await db
      .from("playlists_evento")
      .select(
        "dj_aporte_actual_id, dj_reproduciendo, dj_inicio_reproduccion_at, dj_segundos_acumulados, dj_auto, dj_sincronizar_cola_con_votos"
      )
      .eq("evento_id", eventoId)
      .maybeSingle();
    const djCamposVacío = playlistRowADjCampos(plSolo as Record<string, unknown> | null);
    return {
      modo_fiesta_activo: true,
      en_reproduccion: null,
      siguientes: [],
      ranking_en_vivo: [],
      cola: [],
      dj_estado: {
        auto: djCamposVacío.dj_auto,
        sincronizar_cola_con_votos: djCamposVacío.dj_sincronizar_cola_con_votos,
        reproduciendo: djCamposVacío.dj_reproduciendo,
        segundos_transcurridos: musicaDjSegundosTranscurridos(djCamposVacío),
        duracion_segundos: MUSICA_DJ_DURACION_DEFAULT_SEG,
      },
    };
  }

  const { data: plRow } = await db
    .from("playlists_evento")
    .select(
      "dj_aporte_actual_id, dj_reproduciendo, dj_inicio_reproduccion_at, dj_segundos_acumulados, dj_auto, dj_sincronizar_cola_con_votos"
    )
    .eq("evento_id", eventoId)
    .maybeSingle();

  const djCampos = playlistRowADjCampos(plRow as Record<string, unknown> | null);

  const cancionIds = Array.from(new Set(aportes.map((a) => a.cancion_id).filter(Boolean))) as string[];
  const { data: cancionesRows } = await db
    .from("canciones")
    .select("id, titulo, artista, imagen, duracion_ms")
    .in("id", cancionIds);
  const porCancion = new Map((cancionesRows ?? []).map((c) => [c.id, c]));

  type Row = (typeof aportes)[0];
  const rows = (aportes as Row[]).filter((r) => String(r.estado) === "aprobado");

  const rankingSorted = [...rows]
    .filter((r) => !Boolean((r as { reproducida?: boolean }).reproducida))
    .sort((a, b) => {
      const vl = Number((b as { votos_live?: unknown }).votos_live ?? 0) - Number((a as { votos_live?: unknown }).votos_live ?? 0);
      if (vl !== 0) return vl;
      const vh = Number((b as { votos?: unknown }).votos ?? 0) - Number((a as { votos?: unknown }).votos ?? 0);
      if (vh !== 0) return vh;
      return String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""));
    });

  let yaLiveSet = new Set<string>();
  if (contextoVoto && rankingSorted.length) {
    const ids = rankingSorted.map((r) => r.id);
    let q = db.from("votos_en_vivo").select("aporte_id").in("aporte_id", ids);
    if ("invitado_id" in contextoVoto) q = q.eq("invitado_id", contextoVoto.invitado_id);
    else q = q.eq("usuario_id", contextoVoto.usuario_id);
    const { data: vr } = await q;
    yaLiveSet = new Set((vr ?? []).map((x) => x.aporte_id as string));
  }

  const ranking_en_vivo: MusicaFiestaItemEnriquecido[] = rankingSorted.map((r) => {
    const c = porCancion.get(r.cancion_id);
    const reproducida = Boolean((r as { reproducida?: boolean }).reproducida);
    return {
      aporte_id: r.id,
      titulo: c?.titulo ?? "—",
      artista: c?.artista ?? "",
      votos: Number((r as { votos?: unknown }).votos ?? 0),
      votos_live: Number((r as { votos_live?: unknown }).votos_live ?? 0),
      orden_cola: (r as { orden_cola?: number | null }).orden_cola ?? null,
      en_cola: Boolean((r as { en_cola?: boolean }).en_cola),
      reproducida,
      ya_voto_live: yaLiveSet.has(r.id),
    };
  });

  const enColaSorted = ranking_en_vivo
    .filter((x) => x.en_cola && x.orden_cola != null)
    .sort((a, b) => (a.orden_cola ?? 0) - (b.orden_cola ?? 0));

  const djActualId = djCampos.dj_aporte_actual_id?.trim() || null;
  let en_reproduccion: {
    aporte_id: string;
    titulo: string;
    artista: string;
    imagen: string | null;
    progreso_mock: number;
    duracion_segundos?: number;
    segundos_transcurridos?: number;
    reproduciendo?: boolean;
  } | null = null;

  if (djActualId) {
    const rowDj = rows.find((r) => r.id === djActualId);
    const cDj = rowDj ? porCancion.get(rowDj.cancion_id) : undefined;
    if (rowDj && cDj) {
      const dur = musicaDjDuracionSegundosDesdeMs(cDj.duracion_ms);
      const elapsed = musicaDjSegundosTranscurridos(djCampos);
      en_reproduccion = {
        aporte_id: rowDj.id,
        titulo: cDj.titulo,
        artista: cDj.artista,
        imagen: cDj.imagen ?? null,
        progreso_mock: dur > 0 ? Math.min(1, elapsed / dur) : 0,
        duracion_segundos: dur,
        segundos_transcurridos: elapsed,
        reproduciendo: djCampos.dj_reproduciendo,
      };
    }
  }

  const primeroCola = enColaSorted[0];
  if (!en_reproduccion && primeroCola) {
    const c0 = porCancion.get(rows.find((r) => r.id === primeroCola.aporte_id)?.cancion_id ?? "");
    en_reproduccion = {
      aporte_id: primeroCola.aporte_id,
      titulo: primeroCola.titulo,
      artista: primeroCola.artista,
      imagen: c0?.imagen ?? null,
      progreso_mock: 0.42,
    };
  }

  const usandoDjExplicito = Boolean(djActualId);
  const siguientes = (
    usandoDjExplicito
      ? enColaSorted.slice(0, MUSICA_FIESTA_SIGUIENTES_UI)
      : enColaSorted.slice(1, 1 + MUSICA_FIESTA_SIGUIENTES_UI)
  ).map((x) => ({
    aporte_id: x.aporte_id,
    titulo: x.titulo,
    artista: x.artista,
    orden_cola: x.orden_cola ?? 0,
  }));

  const cola = enColaSorted.map((x) => ({
    aporte_id: x.aporte_id,
    titulo: x.titulo,
    artista: x.artista,
    orden_cola: x.orden_cola ?? 0,
    votos: x.votos,
    votos_live: x.votos_live,
  }));

  const durActual = en_reproduccion?.duracion_segundos ?? MUSICA_DJ_DURACION_DEFAULT_SEG;

  const dj_estado = {
    auto: djCampos.dj_auto,
    sincronizar_cola_con_votos: djCampos.dj_sincronizar_cola_con_votos,
    reproduciendo: djCampos.dj_reproduciendo,
    segundos_transcurridos: en_reproduccion?.segundos_transcurridos ?? musicaDjSegundosTranscurridos(djCampos),
    duracion_segundos: durActual > 0 ? durActual : MUSICA_DJ_DURACION_DEFAULT_SEG,
  };

  return {
    modo_fiesta_activo: true,
    en_reproduccion,
    siguientes,
    ranking_en_vivo,
    cola,
    dj_estado,
  };
}

export async function musicaFiestaRecalcularSiActivo(db: SupabaseClient, eventoId: string): Promise<void> {
  if (!(await musicaFiestaLeerModoActivo(db, eventoId))) return;
  if (!(await musicaFiestaDebeSincronizarColaAutomatica(db, eventoId))) return;
  await musicaFiestaRecalcularCola(db, eventoId);
}

export type MusicaFiestaEstadoRespuesta = Awaited<ReturnType<typeof musicaFiestaEstadoDetalle>>;
