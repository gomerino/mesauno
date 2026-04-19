import type { ProgramaIconoId } from "@/lib/programa-icons";
import { PROGRAMA_ICONOS } from "@/lib/programa-icons";
import type { EventoProgramaHito } from "@/types/database";

export type ProgramaHitoFotoPublic = {
  id: string;
  storage_path: string;
  created_at: string;
};

export type ProgramaConFotosHitoParsed = {
  hito_id: string;
  orden: number;
  hora: string;
  titulo: string;
  descripcion_corta: string | null;
  lugar_nombre: string | null;
  ubicacion_url: string | null;
  icono: string;
  fotos: ProgramaHitoFotoPublic[];
};

export type ProgramaConFotosHub = {
  ok: true;
  evento_id: string;
  fecha_evento: string | null;
  zonahoraria: string;
  hitos: ProgramaConFotosHitoParsed[];
};

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asIsoTimestamp(v: unknown): string | null {
  const s = asString(v)?.trim();
  if (s) return s;
  if (typeof v === "number" && Number.isFinite(v)) {
    try {
      return new Date(v).toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

function normalizeHora(raw: unknown): string {
  const s = asString(raw)?.trim() ?? "";
  if (!s) return "00:00:00";
  if (/^\d{1,2}:\d{2}$/.test(s)) return `${s}:00`;
  if (/^\d{1,2}:\d{2}:\d{2}/.test(s)) return s.slice(0, 8);
  return s;
}

function normalizeIcono(raw: unknown): ProgramaIconoId {
  const s = asString(raw)?.trim() ?? "";
  return (PROGRAMA_ICONOS as readonly string[]).includes(s) ? (s as ProgramaIconoId) : "Music";
}

function parseFotos(raw: unknown): ProgramaHitoFotoPublic[] {
  if (!Array.isArray(raw)) return [];
  const out: ProgramaHitoFotoPublic[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = asString(o.id)?.trim();
    const storage_path = asString(o.storage_path)?.trim();
    const created_at = asIsoTimestamp(o.created_at);
    if (id && storage_path && created_at) out.push({ id, storage_path, created_at });
  }
  return out;
}

function parseHitos(raw: unknown): ProgramaConFotosHitoParsed[] {
  if (!Array.isArray(raw)) return [];
  const out: ProgramaConFotosHitoParsed[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const hito_id = asString(o.hito_id)?.trim();
    const titulo = asString(o.titulo)?.trim();
    if (!hito_id || !titulo) continue;
    const orden = typeof o.orden === "number" && Number.isFinite(o.orden) ? o.orden : 0;
    out.push({
      hito_id,
      orden,
      hora: normalizeHora(o.hora),
      titulo,
      descripcion_corta: asString(o.descripcion_corta),
      lugar_nombre: asString(o.lugar_nombre),
      ubicacion_url: asString(o.ubicacion_url),
      icono: asString(o.icono) ?? "Music",
      fotos: parseFotos(o.fotos),
    });
  }
  out.sort((a, b) => a.orden - b.orden || a.hora.localeCompare(b.hora));
  return out;
}

/** Interpreta el JSON devuelto por `programa_con_fotos_ventanas_publica`. */
export function parseProgramaConFotosVentanasPublica(raw: unknown): ProgramaConFotosHub | null {
  let v: unknown = raw;
  if (typeof raw === "string") {
    try {
      v = JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (o.ok !== true) return null;
  const evento_id = asString(o.evento_id)?.trim();
  if (!evento_id) return null;
  const hitos = parseHitos(o.hitos);
  return {
    ok: true,
    evento_id,
    fecha_evento: asString(o.fecha_evento),
    zonahoraria: asString(o.zonahoraria)?.trim() || "America/Santiago",
    hitos,
  };
}

export function hubHitosToProgramaHitos(hub: ProgramaConFotosHub): EventoProgramaHito[] {
  return hub.hitos.map((h) => ({
    id: h.hito_id,
    evento_id: hub.evento_id,
    hora: h.hora,
    titulo: h.titulo,
    descripcion_corta: h.descripcion_corta,
    lugar_nombre: h.lugar_nombre,
    ubicacion_url: h.ubicacion_url,
    icono: normalizeIcono(h.icono),
    orden: h.orden,
  }));
}

export function programaFotosPorHitoFromHub(hub: ProgramaConFotosHub): Record<string, ProgramaHitoFotoPublic[]> {
  const out: Record<string, ProgramaHitoFotoPublic[]> = {};
  for (const h of hub.hitos) {
    if (h.fotos.length > 0) out[h.hito_id] = h.fotos;
  }
  return out;
}
