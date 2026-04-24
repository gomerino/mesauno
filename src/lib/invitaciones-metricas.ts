import { deriveEstadoEnvio } from "@/lib/invitado-estado-envio";
import { isAsistenciaRespuestaCerrada } from "@/lib/rsvp-ui-state";
import type { Invitado } from "@/types/database";

export type InvitacionesMetricas = {
  total: number;
  pendiente: number;
  enviado: number;
  abierto: number;
  confirmado: number;
  /** Invitados que ya salieron de «pendiente» (enviado + abierto + confirmado). */
  progressPct: number;
};

/** Misma lógica que `useInvitaciones` (servidor o cliente). */
export function getInvitacionesMetricas(rows: Invitado[]): InvitacionesMetricas {
  let pendiente = 0;
  let enviado = 0;
  let abierto = 0;
  let confirmado = 0;
  for (const r of rows) {
    const e = deriveEstadoEnvio(r);
    if (e === "pendiente") pendiente++;
    else if (e === "enviado") enviado++;
    else if (e === "abierto") abierto++;
    else confirmado++;
  }
  const total = rows.length;
  const avanzados = enviado + abierto + confirmado;
  const progressPct =
    total > 0 ? Math.min(100, Math.round((avanzados / total) * 1000) / 10) : 0;
  return {
    total,
    pendiente,
    enviado,
    abierto,
    confirmado,
    progressPct,
  };
}

export type InvitacionesRsvpResumen = {
  /** Total de filas en la lista de invitados. */
  totalInvitados: number;
  confirmadas: number;
  /**
   * Inv. sin enviar (estado derivado `pendiente`) o enviados/abiertos sin RSVP/ásist. cerrada.
   * (Nombre histórico `pendienteConfirmar` en el strip del home.)
   */
  pendienteConfirmar: number;
  /** `rsvp_estado === "declinado"` (no asistiré). */
  noAsistire: number;
};

/**
 * Invitados con acción aún abierta: lista sin enviar (`derive` pendiente) o
 * con invitación en curso (enviado/abierto) y RSVP/ásist. sin cierre (no confirm. ni declinado).
 * Alineado con `deriveEstadoEnvio` (no solo `email_enviado`, a veces null en filas reales).
 */
function invitadoConPendienteAccion(i: Invitado): boolean {
  if (isAsistenciaRespuestaCerrada(i)) return false;
  const e = deriveEstadoEnvio(i);
  if (e === "pendiente") return true;
  if (e === "enviado" || e === "abierto") return true;
  return false;
}

/**
 * Home del panel: total de invitados, confirmados, y tareas abiertas (ver `invitadoConPendienteAccion`).
 */
export function getInvitacionesRsvpResumen(inv: Invitado[]): InvitacionesRsvpResumen {
  const totalInvitados = inv.length;
  const confirmadas = inv.filter(
    (i) => i.rsvp_estado === "confirmado" || i.asistencia_confirmada === true
  ).length;
  const noAsistire = inv.filter((i) => i.rsvp_estado === "declinado").length;
  const pendienteConfirmar = inv.filter(invitadoConPendienteAccion).length;
  return { totalInvitados, confirmadas, noAsistire, pendienteConfirmar };
}

export type InvitadoMetricaFiltro = "todos" | "confirmados" | "no_asistir" | "pendientes";

export function isInvitadoPendienteTareaPanel(i: Invitado): boolean {
  return invitadoConPendienteAccion(i);
}

/** Alinea listado de Pasajeros con clics de métricas en `/panel` (misma noción de categorías). */
export function invitadoPasaFiltroMetrica(
  i: Invitado,
  f: InvitadoMetricaFiltro | null | undefined
): boolean {
  if (!f || f === "todos") return true;
  if (f === "confirmados") {
    return i.rsvp_estado === "confirmado" || i.asistencia_confirmada === true;
  }
  if (f === "no_asistir") return i.rsvp_estado === "declinado";
  if (f === "pendientes") return isInvitadoPendienteTareaPanel(i);
  return true;
}
