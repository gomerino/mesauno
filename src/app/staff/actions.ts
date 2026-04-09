"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type StaffResolveResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; error: string };

export async function staffResolveQrAction(
  eventoId: string,
  rawQr: string
): Promise<StaffResolveResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("staff_resolve_invitado_by_qr", {
    p_evento_id: eventoId,
    p_qr: rawQr.trim(),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const payload = data as Record<string, unknown> | null;
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Respuesta inválida" };
  }
  if (payload.ok === false) {
    return {
      ok: false,
      error:
        payload.error === "invitado_no_encontrado"
          ? "Código no válido para este evento"
          : String(payload.error ?? "Error"),
    };
  }
  if (payload.ok !== true) {
    return { ok: false, error: "Respuesta inválida" };
  }

  return { ok: true, payload };
}

export async function staffRegistrarEntradaAction(invitadoId: string): Promise<StaffResolveResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("staff_set_asistencia_confirmada", {
    p_invitado_id: invitadoId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const payload = data as Record<string, unknown> | null;
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Respuesta inválida" };
  }
  if (payload.ok === false) {
    return { ok: false, error: String(payload.error ?? "Error") };
  }
  if (payload.ok !== true) {
    return { ok: false, error: "Respuesta inválida" };
  }

  revalidatePath("/staff/check-in");
  revalidatePath("/staff/mesas");
  return { ok: true, payload };
}
