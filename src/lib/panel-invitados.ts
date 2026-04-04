import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Invitados visibles en el panel: los de la pareja del usuario y/o los que creó él sin pareja aún.
 * Usa .select(columns) antes de filtros (requerido por PostgREST).
 */
export function invitadosDelPanel(
  supabase: SupabaseClient,
  userId: string,
  parejaId: string | null,
  columns = "*"
) {
  const q = supabase.from("invitados").select(columns);
  if (parejaId) {
    return q.or(`pareja_id.eq.${parejaId},owner_user_id.eq.${userId}`);
  }
  return q.eq("owner_user_id", userId);
}
