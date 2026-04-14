"use server";

import { createClient } from "@/lib/supabase/server";
import { PROGRAMA_ICONOS, type ProgramaIconoId } from "@/lib/programa-icons";
import { revalidatePath } from "next/cache";

function normalizeHora(hora: string): string {
  const t = hora.trim();
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  return t;
}

function assertIcono(s: string): ProgramaIconoId {
  if ((PROGRAMA_ICONOS as readonly string[]).includes(s)) return s as ProgramaIconoId;
  return "Music";
}

async function requireEditor(eventoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null as null, error: "No autenticado" as const };
  const { data: ok, error } = await supabase.rpc("user_is_evento_editor_or_admin", {
    p_evento_id: eventoId,
  });
  if (error || !ok) return { supabase: null as null, error: "Sin permiso para editar el programa" as const };
  return { supabase, error: null as null };
}

function revalidatePrograma() {
  revalidatePath("/panel/programa");
  revalidatePath("/panel/overview");
}

export async function createProgramaHito(
  eventoId: string,
  input: {
    hora: string;
    titulo: string;
    descripcion_corta: string;
    lugar_nombre: string;
    ubicacion_url: string;
    icono: string;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, error } = await requireEditor(eventoId);
  if (!supabase) return { ok: false, error: error ?? "Error" };

  const titulo = input.titulo.trim();
  if (!titulo) return { ok: false, error: "El título es obligatorio" };

  const { data: maxRow } = await supabase
    .from("evento_programa_hitos")
    .select("orden")
    .eq("evento_id", eventoId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrden =
    maxRow != null && maxRow.orden != null ? Number(maxRow.orden) + 1 : 0;

  const ubicacion = input.ubicacion_url.trim();
  const { error: insErr } = await supabase.from("evento_programa_hitos").insert({
    evento_id: eventoId,
    hora: normalizeHora(input.hora),
    titulo,
    descripcion_corta: input.descripcion_corta.trim() || null,
    lugar_nombre: input.lugar_nombre.trim() || null,
    ubicacion_url: ubicacion ? ubicacion : null,
    icono: assertIcono(input.icono),
    orden: nextOrden,
  });

  if (insErr) return { ok: false, error: insErr.message };
  revalidatePrograma();
  return { ok: true };
}

export async function updateProgramaHito(
  eventoId: string,
  id: string,
  input: {
    hora: string;
    titulo: string;
    descripcion_corta: string;
    lugar_nombre: string;
    ubicacion_url: string;
    icono: string;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, error } = await requireEditor(eventoId);
  if (!supabase) return { ok: false, error: error ?? "Error" };

  const titulo = input.titulo.trim();
  if (!titulo) return { ok: false, error: "El título es obligatorio" };

  const ubicacion = input.ubicacion_url.trim();
  const { error: upErr } = await supabase
    .from("evento_programa_hitos")
    .update({
      hora: normalizeHora(input.hora),
      titulo,
      descripcion_corta: input.descripcion_corta.trim() || null,
      lugar_nombre: input.lugar_nombre.trim() || null,
      ubicacion_url: ubicacion ? ubicacion : null,
      icono: assertIcono(input.icono),
    })
    .eq("id", id)
    .eq("evento_id", eventoId);

  if (upErr) return { ok: false, error: upErr.message };
  revalidatePrograma();
  return { ok: true };
}

export async function deleteProgramaHito(
  eventoId: string,
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, error } = await requireEditor(eventoId);
  if (!supabase) return { ok: false, error: error ?? "Error" };

  const { error: delErr } = await supabase
    .from("evento_programa_hitos")
    .delete()
    .eq("id", id)
    .eq("evento_id", eventoId);

  if (delErr) return { ok: false, error: delErr.message };
  revalidatePrograma();
  return { ok: true };
}

export async function reorderProgramaHitos(
  eventoId: string,
  orderedIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, error } = await requireEditor(eventoId);
  if (!supabase) return { ok: false, error: error ?? "Error" };

  if (!orderedIds.length) return { ok: true };

  const { data: rows, error: fetchErr } = await supabase
    .from("evento_programa_hitos")
    .select("id")
    .eq("evento_id", eventoId);

  if (fetchErr) return { ok: false, error: fetchErr.message };
  const allowed = new Set((rows ?? []).map((r) => r.id as string));
  if (orderedIds.some((id) => !allowed.has(id))) {
    return { ok: false, error: "Lista de hitos no válida" };
  }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error: u } = await supabase
      .from("evento_programa_hitos")
      .update({ orden: i })
      .eq("id", orderedIds[i])
      .eq("evento_id", eventoId);
    if (u) return { ok: false, error: u.message };
  }

  revalidatePrograma();
  return { ok: true };
}
