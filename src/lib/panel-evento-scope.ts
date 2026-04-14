import type { SupabaseClient } from "@supabase/supabase-js";
import { selectEventoForMember } from "@/lib/evento-membership";

/**
 * Evento actual del miembro en panel + comprobación de acceso al área que antes vivía en /dashboard.
 */
export async function requirePanelScopedEventoId(
  supabase: SupabaseClient,
  userId: string
): Promise<{ ok: true; eventoId: string } | { ok: false; redirect: string }> {
  const { data: evento } = await selectEventoForMember(supabase, userId, "id");
  if (!evento?.id) {
    return { ok: false, redirect: "/panel/evento" };
  }
  const { data: canAccess, error } = await supabase.rpc("user_is_evento_dashboard_member", {
    p_evento_id: evento.id,
  });
  if (error || !canAccess) {
    return { ok: false, redirect: "/panel/overview" };
  }
  return { ok: true, eventoId: evento.id as string };
}
