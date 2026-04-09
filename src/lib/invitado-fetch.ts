import type { SupabaseClient } from "@supabase/supabase-js";
import type { Invitado } from "@/types/database";
import { mergeInvitadoAcompanantesIntoRows } from "@/lib/panel-invitados";

/**
 * Invitado público por `id` o `token_acceso` (p. ej. `/invitacion/[token]`): evita depender solo del embed PostgREST,
 * que puede devolver `invitado_acompanantes` vacío si RLS del hijo difiere del padre.
 */
export async function fetchInvitadoWithAcompanantes(
  supabase: SupabaseClient,
  tokenOrId: string
): Promise<{ data: Invitado | null; error: Error | null }> {
  const { data: row, error: e1 } = await supabase
    .from("invitados")
    .select("*")
    .or(`id.eq.${tokenOrId},token_acceso.eq.${tokenOrId}`)
    .maybeSingle();
  if (e1 || !row) {
    return { data: null, error: e1 as Error | null };
  }

  const [merged] = await mergeInvitadoAcompanantesIntoRows(supabase, [row as Record<string, unknown>]);
  return { data: merged as unknown as Invitado, error: null };
}
