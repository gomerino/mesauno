import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Primer evento donde el usuario es miembro (panel asume un evento por usuario; si hay varios, el más antiguo).
 * `any` evita choques de tipos con `.select(columns)` dinámico y tablas sin tipar en el cliente generado.
 */
export async function selectEventoForMember(supabase: SupabaseClient, userId: string, columns = "*") {
  const db: any = supabase;
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
