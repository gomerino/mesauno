import type { SupabaseClient } from "@supabase/supabase-js";
import type { AporteCancionEstado, Cancion } from "@/types/database";

/** Máximo de sugerencias activas (pendiente o aprobada) por invitado o por miembro (vía panel) por evento. */
export const MUSICA_LIMITE_SUGERENCIAS_POR_PERSONA = 3;

export type MusicaListaItem = {
  aporte_id: string;
  estado: AporteCancionEstado;
  titulo: string;
  artista: string;
  imagen: string | null;
  usuario: string;
  votos: number;
  creado_en: string;
  /** Rellenado en la ruta API según token o sesión. */
  ya_voto: boolean;
};

type CancionRow = Pick<Cancion, "id" | "spotify_id" | "titulo" | "artista" | "imagen">;

export async function musicaInvitadoTokenValidoParaEvento(
  db: SupabaseClient,
  token: string,
  eventoId: string
): Promise<boolean> {
  const t = token.trim();
  if (!t || !eventoId) return false;
  const { data, error } = await db
    .from("invitados")
    .select("id")
    .eq("token_acceso", t)
    .eq("evento_id", eventoId)
    .maybeSingle();
  return !error && Boolean(data?.id);
}

export async function musicaInvitadoIdDesdeToken(
  db: SupabaseClient,
  token: string,
  eventoId: string
): Promise<string | null> {
  const t = token.trim();
  if (!t || !eventoId) return null;
  const { data, error } = await db
    .from("invitados")
    .select("id")
    .eq("token_acceso", t)
    .eq("evento_id", eventoId)
    .maybeSingle();
  if (error || !data?.id) return null;
  return data.id;
}

export async function musicaContarSugerenciasActivasInvitado(
  db: SupabaseClient,
  eventoId: string,
  invitadoId: string
): Promise<number> {
  const { count, error } = await db
    .from("aportes_canciones")
    .select("*", { count: "exact", head: true })
    .eq("evento_id", eventoId)
    .eq("invitado_id", invitadoId)
    .in("estado", ["pendiente", "aprobado"]);
  if (error) {
    console.error("[musica] contar sugerencias invitado", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function musicaContarSugerenciasActivasUsuarioMiembro(
  db: SupabaseClient,
  eventoId: string,
  userId: string
): Promise<number> {
  const { count, error } = await db
    .from("aportes_canciones")
    .select("*", { count: "exact", head: true })
    .eq("evento_id", eventoId)
    .eq("usuario_id", userId)
    .eq("fuente", "novio")
    .in("estado", ["pendiente", "aprobado"]);
  if (error) {
    console.error("[musica] contar sugerencias miembro", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function musicaInvitadoPuedeAgregar(
  db: SupabaseClient,
  token: string,
  eventoId: string
): Promise<{ ok: true; invitado_id: string } | { ok: false }> {
  const t = token.trim();
  if (!t || !eventoId) return { ok: false };
  const { data, error } = await db
    .from("invitados")
    .select("id, evento_id, rsvp_estado")
    .eq("token_acceso", t)
    .maybeSingle();
  if (error || !data?.id || data.evento_id !== eventoId) return { ok: false };
  if (data.rsvp_estado !== "confirmado") return { ok: false };
  return { ok: true, invitado_id: data.id };
}

export async function musicaUsuarioEsAdminEvento(
  db: SupabaseClient,
  userId: string,
  eventoId: string
): Promise<boolean> {
  const { data, error } = await db
    .from("evento_miembros")
    .select("rol")
    .eq("evento_id", eventoId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return false;
  return data.rol === "admin";
}

/** Admin o editor del evento pueden aprobar sugerencias y sincronizar Spotify (misma lógica que el panel). */
export async function musicaUsuarioPuedeModerarPlaylist(
  db: SupabaseClient,
  userId: string,
  eventoId: string
): Promise<boolean> {
  const { data, error } = await db
    .from("evento_miembros")
    .select("rol")
    .eq("evento_id", eventoId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return false;
  return data.rol === "admin" || data.rol === "editor";
}

export async function musicaUsuarioMiembroEvento(
  db: SupabaseClient,
  userId: string,
  eventoId: string
): Promise<boolean> {
  const { data, error } = await db
    .from("evento_miembros")
    .select("id")
    .eq("evento_id", eventoId)
    .eq("user_id", userId)
    .maybeSingle();
  return !error && Boolean(data?.id);
}

async function obtenerOCrearCancion(
  db: SupabaseClient,
  input: {
    spotify_id: string;
    titulo: string;
    artista: string;
    imagen: string | null;
  }
): Promise<CancionRow | null> {
  const sid = input.spotify_id.trim();
  if (!sid) return null;
  const { data: existente } = await db.from("canciones").select("*").eq("spotify_id", sid).maybeSingle();
  if (existente) return existente as CancionRow;

  const { data: inserted, error } = await db
    .from("canciones")
    .insert({
      spotify_id: sid,
      titulo: input.titulo.trim().slice(0, 500),
      artista: input.artista.trim().slice(0, 500),
      imagen: input.imagen?.trim() || null,
      duracion_ms: null,
    })
    .select("id, spotify_id, titulo, artista, imagen")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") {
      const { data: retry } = await db.from("canciones").select("*").eq("spotify_id", sid).maybeSingle();
      if (retry) return retry as CancionRow;
    }
    console.error("[musica] insert cancion", error.message);
    return null;
  }
  return inserted as CancionRow | null;
}

export async function musicaAgregarAporteInvitado(
  db: SupabaseClient,
  input: {
    evento_id: string;
    invitado_id: string;
    spotify_id: string;
    titulo: string;
    artista: string;
    imagen: string | null;
  }
): Promise<{ ok: true; duplicado?: boolean } | { ok: false; code: string }> {
  const cancion = await obtenerOCrearCancion(db, input);
  if (!cancion?.id) return { ok: false, code: "cancion" };

  const { data: dup } = await db
    .from("aportes_canciones")
    .select("id")
    .eq("evento_id", input.evento_id)
    .eq("cancion_id", cancion.id)
    .maybeSingle();
  if (dup?.id) return { ok: true, duplicado: true };

  const { error } = await db.from("aportes_canciones").insert({
    evento_id: input.evento_id,
    invitado_id: input.invitado_id,
    usuario_id: null,
    cancion_id: cancion.id,
    estado: "pendiente",
    fuente: "invitado",
  });
  if (error) {
    if (error.code === "23505") return { ok: true, duplicado: true };
    console.error("[musica] insert aporte invitado", error.message);
    return { ok: false, code: "insert" };
  }
  return { ok: true };
}

export async function musicaAgregarAporteNovio(
  db: SupabaseClient,
  input: {
    evento_id: string;
    usuario_id: string;
    spotify_id: string;
    titulo: string;
    artista: string;
    imagen: string | null;
  }
): Promise<{ ok: true; duplicado?: boolean } | { ok: false; code: string }> {
  const cancion = await obtenerOCrearCancion(db, input);
  if (!cancion?.id) return { ok: false, code: "cancion" };

  const { data: dup } = await db
    .from("aportes_canciones")
    .select("id")
    .eq("evento_id", input.evento_id)
    .eq("cancion_id", cancion.id)
    .maybeSingle();
  if (dup?.id) return { ok: true, duplicado: true };

  const { error } = await db.from("aportes_canciones").insert({
    evento_id: input.evento_id,
    invitado_id: null,
    usuario_id: input.usuario_id,
    cancion_id: cancion.id,
    estado: "pendiente",
    fuente: "novio",
  });
  if (error) {
    if (error.code === "23505") return { ok: true, duplicado: true };
    console.error("[musica] insert aporte novio", error.message);
    return { ok: false, code: "insert" };
  }
  return { ok: true };
}

function etiquetaUsuario(fuente: string, nombreInvitado: string | null): string {
  if (fuente === "novio") return "Novios";
  return nombreInvitado?.trim() || "Invitado";
}

export type MusicaListarAportesResult =
  | { ok: true; items: MusicaListaItem[] }
  | { ok: false; items: []; code: string };

export async function musicaListarAportes(db: SupabaseClient, eventoId: string): Promise<MusicaListarAportesResult> {
  const { data: aportes, error: e1 } = await db
    .from("aportes_canciones")
    .select("id, estado, fuente, created_at, invitado_id, cancion_id, votos")
    .eq("evento_id", eventoId);

  if (e1) {
    console.error("[musica] listar aportes", e1.message);
    return { ok: false, items: [], code: "db_aportes" };
  }
  if (!aportes?.length) return { ok: true, items: [] };

  const cancionIds = Array.from(new Set(aportes.map((a) => a.cancion_id).filter(Boolean))) as string[];
  const { data: cancionesRows, error: eCanc } = await db
    .from("canciones")
    .select("id, titulo, artista, imagen")
    .in("id", cancionIds);
  if (eCanc) {
    console.error("[musica] listar canciones", eCanc.message);
    return { ok: false, items: [], code: "db_canciones" };
  }
  const porCancion = new Map((cancionesRows ?? []).map((c) => [c.id, c]));

  const invIds = Array.from(new Set(aportes.map((a) => a.invitado_id).filter(Boolean))) as string[];
  let invMap = new Map<string, string>();
  if (invIds.length) {
    const { data: invRows, error: eInv } = await db.from("invitados").select("id, nombre_pasajero").in("id", invIds);
    if (eInv) {
      console.error("[musica] listar invitados", eInv.message);
      return { ok: false, items: [], code: "db_invitados" };
    }
    invMap = new Map((invRows ?? []).map((i) => [i.id, i.nombre_pasajero ?? ""]));
  }

  const mapped: MusicaListaItem[] = aportes.map((r) => {
    const c = porCancion.get(r.cancion_id);
    const nombreInv = r.invitado_id ? invMap.get(r.invitado_id) ?? null : null;
    const votosRaw = Number((r as { votos?: unknown }).votos ?? 0);
    return {
      aporte_id: r.id,
      estado: r.estado as AporteCancionEstado,
      titulo: c?.titulo ?? "—",
      artista: c?.artista ?? "",
      imagen: c?.imagen ?? null,
      usuario: etiquetaUsuario(String(r.fuente), nombreInv),
      votos: Number.isFinite(votosRaw) ? votosRaw : 0,
      creado_en: r.created_at ?? "",
      ya_voto: false,
    };
  });

  const aprobadas = mapped
    .filter((x) => x.estado === "aprobado")
    .sort(
      (a, b) =>
        (b.votos ?? 0) - (a.votos ?? 0) || (a.creado_en || "").localeCompare(b.creado_en || "")
    );
  const pendientes = mapped
    .filter((x) => x.estado === "pendiente")
    .sort((a, b) => (a.creado_en || "").localeCompare(b.creado_en || ""));
  const rechazadas = mapped
    .filter((x) => x.estado === "rechazado")
    .sort((a, b) => (a.creado_en || "").localeCompare(b.creado_en || ""));

  return { ok: true, items: [...aprobadas, ...pendientes, ...rechazadas] };
}

export async function musicaMarcarYaVotoEnItems(
  db: SupabaseClient,
  items: MusicaListaItem[],
  contexto: { invitado_id: string } | { usuario_id: string }
): Promise<MusicaListaItem[]> {
  const ids = items.map((i) => i.aporte_id).filter(Boolean);
  if (!ids.length) return items;

  let q = db.from("votos_canciones").select("aporte_id").in("aporte_id", ids);
  if ("invitado_id" in contexto) {
    q = q.eq("invitado_id", contexto.invitado_id);
  } else {
    q = q.eq("usuario_id", contexto.usuario_id);
  }
  const { data: rows, error } = await q;
  if (error) {
    console.error("[musica] votos ya emitidos", error.message);
    return items;
  }
  const conVoto = new Set((rows ?? []).map((r) => r.aporte_id as string));
  return items.map((i) => ({ ...i, ya_voto: conVoto.has(i.aporte_id) }));
}

export type MusicaRegistrarVotoResult =
  | { ok: true; votos: number; ya_votado?: boolean }
  | { ok: false; code: string };

export async function musicaRegistrarVoto(
  db: SupabaseClient,
  input: {
    evento_id: string;
    aporte_id: string;
    invitado_id?: string | null;
    usuario_id?: string | null;
  }
): Promise<MusicaRegistrarVotoResult> {
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

  const { error: insErr } = await db.from("votos_canciones").insert(row);
  if (insErr) {
    if (insErr.code === "23505") {
      const { data: v } = await db.from("aportes_canciones").select("votos").eq("id", input.aporte_id).maybeSingle();
      return { ok: true, votos: typeof v?.votos === "number" ? v.votos : 0, ya_votado: true };
    }
    console.error("[musica] insert voto", insErr.message);
    return { ok: false, code: "insert" };
  }

  const { data: v2 } = await db.from("aportes_canciones").select("votos").eq("id", input.aporte_id).maybeSingle();
  return { ok: true, votos: typeof v2?.votos === "number" ? v2.votos : 0 };
}

export async function musicaActualizarEstadoAporte(
  db: SupabaseClient,
  aporteId: string,
  eventoId: string,
  estado: "aprobado" | "rechazado"
): Promise<boolean> {
  const { error } = await db
    .from("aportes_canciones")
    .update({ estado })
    .eq("id", aporteId)
    .eq("evento_id", eventoId);
  if (error) {
    console.error("[musica] update estado", error.message);
    return false;
  }
  return true;
}

export async function musicaUrisAprobadasOrdenadas(
  db: SupabaseClient,
  eventoId: string
): Promise<string[]> {
  const { data: aportes, error } = await db
    .from("aportes_canciones")
    .select("cancion_id, created_at, votos")
    .eq("evento_id", eventoId)
    .eq("estado", "aprobado")
    .order("votos", { ascending: false })
    .order("created_at", { ascending: true });

  if (error || !aportes?.length) {
    if (error) console.error("[musica] uris aprobadas", error.message);
    return [];
  }
  const ids = Array.from(new Set(aportes.map((a) => a.cancion_id))) as string[];
  const { data: cancionesRows } = await db.from("canciones").select("id, spotify_id").in("id", ids);
  const sidPorId = new Map((cancionesRows ?? []).map((c) => [c.id, c.spotify_id]));
  const uris: string[] = [];
  for (const a of aportes) {
    const sid = sidPorId.get(a.cancion_id)?.trim();
    if (sid) uris.push(`spotify:track:${sid}`);
  }
  return uris;
}
