import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Solo `staff_centro` en todos los eventos (sin rol admin/editor en ninguno).
 */
export async function isUserStaffOnly(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabase.from("evento_miembros").select("rol").eq("user_id", userId);

  if (error || !data?.length) return false;

  return data.every((r) => (r as { rol: string }).rol === "staff_centro");
}
