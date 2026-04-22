"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/public-origin";
import { runBulkInvitationSend, type BulkInvitationMode } from "@/lib/send-invitations-bulk";

export async function sendInvitationsFromPanelAction(eventoId: string, mode: BulkInvitationMode) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "No autenticado" };
  }

  const siteOrigin = await getSiteOrigin();
  const result = await runBulkInvitationSend(supabase, {
    eventoId: eventoId.trim(),
    mode,
    siteOrigin,
  });

  if (result.ok) {
    revalidatePath("/panel");
    revalidatePath("/panel/pasajeros");
    revalidatePath("/panel/pasajeros/envios");
    revalidatePath("/panel/pasajeros/vista");
  }

  return result;
}
