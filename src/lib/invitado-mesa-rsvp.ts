import type { Invitado } from "@/types/database";
import { hasCompletedRsvp } from "@/lib/rsvp-ui-state";

/** Misma noción de «confirmó» que el resto del panel. */
function esRsvpConfirmado(i: Invitado): boolean {
  return i.rsvp_estado === "confirmado" || i.asistencia_confirmada === true;
}

/**
 * Resumen de RSVP en una mesa: respuestas sí / no, y sin respuesta final
 * (null, «pendiente», o aún no respondió; excluye declinado y confirmado de «pend.»).
 */
export function resumenMesaRsvp(invitados: Invitado[]) {
  let confirmados = 0;
  let noAsistire = 0;
  let pendienteRespuesta = 0;
  for (const r of invitados) {
    if (esRsvpConfirmado(r)) {
      confirmados++;
      continue;
    }
    if (r.rsvp_estado === "declinado") {
      noAsistire++;
      continue;
    }
    if (!hasCompletedRsvp(r.rsvp_estado)) {
      pendienteRespuesta++;
    }
  }
  return {
    confirmados,
    noAsistire,
    pendienteRespuesta,
    total: invitados.length,
  };
}
