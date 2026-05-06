import type { Invitado } from "@/types/database";

/**
 * Un solo estado por fila en la lista del panel: respuesta a la asistencia.
 * (El seguimiento de envío/abierto queda en métricas, no se duplica aquí.)
 */
export type EstadoListaInvitado = "pendiente" | "acepto" | "rechazo";

/**
 * - **Rechazó**: `rsvp_estado === "declinado"`.
 * - **Aceptó**: RSVP "confirmado", o check-in con RSVP que no sea «en duda» (`pendiente` explícito con conflicto: no contamos check-in + pendiente como «sí»; solo `asistencia_confirmada` con rsvp null/confirmado).
 * - **Pendiente**: todo lo demás (sin respuesta, «Aún no lo tengo claro» = `pendiente`, o enviado/abierto sin confirmación aún).
 */
export function deriveEstadoListaInvitado(row: Invitado): EstadoListaInvitado {
  if (row.rsvp_estado === "declinado") {
    return "rechazo";
  }
  if (row.rsvp_estado === "confirmado") {
    return "acepto";
  }
  if (
    row.asistencia_confirmada === true &&
    row.rsvp_estado !== "pendiente" &&
    row.rsvp_estado !== "declinado"
  ) {
    return "acepto";
  }
  return "pendiente";
}

export const ETIQUETA_ESTADO_LISTA: Record<EstadoListaInvitado, string> = {
  pendiente: "Pendiente",
  acepto: "Aceptó",
  rechazo: "Rechazó",
};
