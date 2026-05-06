import type { EstadoEnvioInvitacion, Invitado } from "@/types/database";

/** Con RSVP «sí asistiré» o asistencia marcada en puerta, el flujo pasa a confirmado. */
function asistenciaConfirmaFila(row: Invitado): boolean {
  return row.rsvp_estado === "confirmado" || row.asistencia_confirmada === true;
}

/**
 * Nivel de envío sin el hito "confirmado" (invitación enviada, abierta o aún no enviada).
 */
function inferSinConfirmadoFila(row: Invitado): "pendiente" | "enviado" | "abierto" {
  if (row.invitacion_vista && row.email_enviado) return "abierto";
  if (row.email_enviado) return "enviado";
  return "pendiente";
}

/**
 * `estado_envio` en BD; si falta, infiere desde columnas legacy.
 * Si en BD quedó `confirmado` pero el RSVP dejó de ser "confirmado" (p. ej. pasó a
 * «Aún no lo tengo claro») y aún no se re-sincronizó la fila, no se muestra "confirmado":
 * se re-infiere desde vista/correo.
 */
export function deriveEstadoEnvio(row: Invitado): EstadoEnvioInvitacion {
  if (asistenciaConfirmaFila(row)) {
    return "confirmado";
  }
  const raw = row.estado_envio;
  if (raw === "confirmado") {
    return inferSinConfirmadoFila(row);
  }
  if (raw === "enviado" || raw === "abierto") {
    return raw;
  }
  /** Fila con `estado_envio: pendiente` en BD aunque el correo ya se envió o hubo apertura (backfill/legacy). */
  if (raw === "pendiente" && (row.email_enviado || row.invitacion_vista)) {
    return inferSinConfirmadoFila(row);
  }
  if (raw === "pendiente") {
    return "pendiente";
  }
  if (row.invitacion_vista && row.email_enviado) return "abierto";
  if (row.email_enviado) return "enviado";
  return "pendiente";
}

/**
 * `estado_envio` a persistir tras un POST de `/api/rsvp` (misma lógica que el panel vía `deriveEstadoEnvio`).
 */
export function computeEstadoEnvioAfterRsvp(
  prior: Invitado,
  nuevo: Pick<Invitado, "rsvp_estado">
): EstadoEnvioInvitacion {
  return deriveEstadoEnvio({ ...prior, rsvp_estado: nuevo.rsvp_estado } as Invitado);
}
