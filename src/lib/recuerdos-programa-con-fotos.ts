import type { SupabaseClient } from "@supabase/supabase-js";
import { parseProgramaConFotosVentanasPublica, type ProgramaConFotosHub } from "@/lib/programa-con-fotos-publica";

type LooseRpc = {
  rpc: (name: string, p: { p_evento_id?: string; p_token?: string }) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

/**
 * Misma carga de hitos + fotos por ventana que la invitación, priorizando el RPC de panel.
 * Si el RPC de miembro falla o el usuario queda sin permisos al resolver `ok`, hace fallback a
 * `programa_con_fotos_ventanas_publica` con un token de acceso (id o `token_acceso`) de un invitado
 * del evento — el mismo criterio que la página `/invitacion/[token]`, para alinear recuerdos con
 * lo que ven los invitados.
 */
export async function loadProgramaConFotosHubForRecuerdos(
  supabase: SupabaseClient,
  eventoId: string
): Promise<ProgramaConFotosHub | null> {
  const s = supabase as unknown as LooseRpc;

  const { data: raw, error: memberErr } = await s.rpc("programa_con_fotos_ventanas_miembro", { p_evento_id: eventoId });
  const hub = !memberErr ? parseProgramaConFotosVentanasPublica(raw) : null;
  if (hub) return hub;

  const { data: inv, error: invErr } = await supabase
    .from("invitados")
    .select("id, token_acceso")
    .eq("evento_id", eventoId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (invErr) return null;

  const first = inv as { id: string; token_acceso: string | null } | null;
  const token = (first?.token_acceso && String(first.token_acceso).trim()) || first?.id;
  if (!token) return null;

  const { data: pubRaw, error: pubErr } = await s.rpc("programa_con_fotos_ventanas_publica", { p_token: String(token) });
  if (pubErr) return null;
  return parseProgramaConFotosVentanasPublica(pubRaw);
}
