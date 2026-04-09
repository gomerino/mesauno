import type { SupabaseClient } from "@supabase/supabase-js";

/** Eventos donde el usuario es `staff_centro`. */
export async function fetchStaffEventoIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("evento_miembros")
    .select("evento_id")
    .eq("user_id", userId)
    .eq("rol", "staff_centro");

  if (error || !data) return [];
  return data.map((r) => r.evento_id as string).filter(Boolean);
}

export function resolveStaffEventoId(eventoIds: string[], query: string | null | undefined): string {
  if (query && eventoIds.includes(query)) return query;
  return eventoIds[0] ?? "";
}
