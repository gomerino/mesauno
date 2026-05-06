/** Modelo único de UI para RSVP (fuente de verdad en cliente mapeada desde DB). */
export type RsvpUiState = "pending" | "confirmed" | "declined";

export type RsvpDbEstado = "confirmado" | "declinado" | "pendiente";

/** Convierte `invitados.rsvp_estado` al modelo de UI. */
export function rsvpUiStateFromDb(rsvp_estado: string | null | undefined): RsvpUiState {
  const s = rsvp_estado?.trim();
  if (s === "confirmado") return "confirmed";
  if (s === "declinado") return "declined";
  return "pending";
}

/** `true` si el invitado ya respondió (sí o no), no solo pendiente / sin datos. */
export function hasCompletedRsvp(rsvp_estado: string | null | undefined): boolean {
  const s = rsvp_estado?.trim();
  return s === "confirmado" || s === "declinado";
}

export type RsvpAsistenciaCerradaFields = {
  rsvp_estado: "pendiente" | "confirmado" | "declinado" | null;
  asistencia_confirmada?: boolean | null;
};

/**
 * Asistencia «cerrada» para el panel: RSVP definitivo (sí/no) o check-in, salvo
 * el caso `rsvp_estado === "pendiente"` (p. ej. «Aún no lo tengo claro») que no debe
 * ocultar el flujo de envío ni resumirse como asistencia confirmada.
 */
export function isAsistenciaRespuestaCerrada(row: RsvpAsistenciaCerradaFields): boolean {
  if (row.rsvp_estado === "pendiente" && row.asistencia_confirmada === true) {
    return false;
  }
  if (row.asistencia_confirmada === true) return true;
  return hasCompletedRsvp(row.rsvp_estado);
}

export function dbEstadoFromUi(ui: RsvpUiState): RsvpDbEstado {
  if (ui === "confirmed") return "confirmado";
  if (ui === "declined") return "declinado";
  return "pendiente";
}
