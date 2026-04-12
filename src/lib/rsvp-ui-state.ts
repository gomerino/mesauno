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

export function dbEstadoFromUi(ui: RsvpUiState): RsvpDbEstado {
  if (ui === "confirmed") return "confirmado";
  if (ui === "declined") return "declinado";
  return "pendiente";
}
