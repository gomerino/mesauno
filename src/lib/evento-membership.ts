import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Primer evento donde el usuario es miembro (panel asume un evento por usuario; si hay varios, el más antiguo).
 */
export async function selectEventoForMember(supabase: SupabaseClient, userId: string, columns = "*") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: memb, error: e1 } = await db
    .from("evento_miembros")
    .select("evento_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (e1) return { data: null, error: e1 };
  if (!memb?.evento_id) return { data: null, error: null };
  return db.from("eventos").select(columns).eq("id", memb.evento_id).maybeSingle();
}
