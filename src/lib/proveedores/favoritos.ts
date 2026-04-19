import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProveedorFavorito } from "@/types/database";

/**
 * Favoritos = "Agregar proveedor a mi evento".
 *
 * UNIQUE(evento_id, proveedor_id, COALESCE(servicio_id, sentinel)) está en la
 * migración — agregar el mismo item dos veces es idempotente (no error).
 */

export type AgregarFavoritoInput = {
  eventoId: string;
  proveedorId: string;
  servicioId?: string | null;
  nota?: string | null;
};

export type AgregarFavoritoResult = {
  favorito: ProveedorFavorito;
  /** true si ya estaba agregado y se devuelve el row existente. */
  yaExistia: boolean;
};

export async function agregarFavorito(
  supabase: SupabaseClient,
  userId: string,
  input: AgregarFavoritoInput,
): Promise<AgregarFavoritoResult> {
  const { data: filaInsertada, error: errInsert } = await supabase
    .from("proveedor_favoritos")
    .insert({
      evento_id: input.eventoId,
      proveedor_id: input.proveedorId,
      servicio_id: input.servicioId ?? null,
      agregado_por: userId,
      nota: input.nota ?? null,
    })
    .select("*")
    .single();

  if (!errInsert && filaInsertada) {
    return { favorito: filaInsertada as ProveedorFavorito, yaExistia: false };
  }

  // Si el insert falla por UNIQUE violation, devolvemos el row existente.
  if (errInsert && esUniqueViolation(errInsert)) {
    const existente = await buscarFavorito(supabase, input);
    if (existente) {
      return { favorito: existente, yaExistia: true };
    }
  }

  throw errInsert ?? new Error("error_favorito_desconocido");
}

export async function eliminarFavorito(
  supabase: SupabaseClient,
  favoritoId: string,
): Promise<void> {
  const { error } = await supabase
    .from("proveedor_favoritos")
    .delete()
    .eq("id", favoritoId);
  if (error) throw error;
}

export async function listarFavoritosPorEvento(
  supabase: SupabaseClient,
  eventoId: string,
): Promise<ProveedorFavorito[]> {
  const { data, error } = await supabase
    .from("proveedor_favoritos")
    .select("*")
    .eq("evento_id", eventoId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProveedorFavorito[];
}

async function buscarFavorito(
  supabase: SupabaseClient,
  input: AgregarFavoritoInput,
): Promise<ProveedorFavorito | null> {
  let q = supabase
    .from("proveedor_favoritos")
    .select("*")
    .eq("evento_id", input.eventoId)
    .eq("proveedor_id", input.proveedorId);

  q = input.servicioId
    ? q.eq("servicio_id", input.servicioId)
    : q.is("servicio_id", null);

  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return (data ?? null) as ProveedorFavorito | null;
}

function esUniqueViolation(err: { code?: string; message?: string }): boolean {
  return err.code === "23505" || /duplicate key value/i.test(err.message ?? "");
}
