"use server";

import { createClient } from "@/lib/supabase/server";

/** Marca apertura de la invitación (anon o sesión); no bloquea el render. */
export async function markInvitacionVistaAction(token: string) {
  const t = token?.trim();
  if (!t) return;

  const supabase = await createClient();
  await supabase.rpc("mark_invitacion_vista", { p_token: t });
}
