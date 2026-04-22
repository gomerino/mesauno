import type { EstadoEnvioInvitacion, Invitado } from "@/types/database";

/**
 * `estado_envio` en BD; si falta (filas previas a la migración), infiere desde columnas legacy.
 */
export function deriveEstadoEnvio(row: Invitado): EstadoEnvioInvitacion {
  const raw = row.estado_envio;
  if (
    raw === "pendiente" ||
    raw === "enviado" ||
    raw === "abierto" ||
    raw === "confirmado"
  ) {
    return raw;
  }
  if (row.rsvp_estado === "confirmado") return "confirmado";
  if (row.invitacion_vista && row.email_enviado) return "abierto";
  if (row.email_enviado) return "enviado";
  return "pendiente";
}
