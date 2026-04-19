import type { Invitado } from "@/types/database";

export type GuestMissionState = "empty" | "in_progress" | "completed";

/**
 * Fuente única del estado de misión "Invitados".
 *
 * Reglas:
 * - empty: 0 invitados.
 * - in_progress: >=1 invitado y sin señales de invitación compartida.
 * - completed: >=1 invitado y al menos una invitación enviada o vista.
 */
export function resolveGuestMissionState(invitados: Pick<Invitado, "email_enviado" | "invitacion_vista">[]): GuestMissionState {
  if (invitados.length === 0) return "empty";
  const shared = invitados.some((i) => i.email_enviado === true || i.invitacion_vista === true);
  return shared ? "completed" : "in_progress";
}

export function guestMissionCtaLabel(state: GuestMissionState): string {
  switch (state) {
    case "empty":
      return "Agregar invitados";
    case "in_progress":
      return "Continuar invitados";
    case "completed":
      return "Ver invitados";
    default:
      return "Ver invitados";
  }
}
