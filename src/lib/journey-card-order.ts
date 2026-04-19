import type { JourneyPhaseId } from "@/lib/journey-phases";

/**
 * Identificadores de las 4 tarjetas del home del viaje (`JourneyViajeClient`).
 * Orden visual base depende de la fase temporal (JUR-51 / B01-01).
 */
export type JourneyCardKey = "evento" | "pasajeros" | "programa" | "experiencia";

/**
 * Prioridad base por fase: número menor = más arriba en la grilla antes de aplicar
 * penalización por estado (completado / bloqueado).
 *
 * | Fase (tiempo) | 1º | 2º | 3º | 4º |
 * |---------------|----|----|----|-----|
 * | Preparativos (`check-in`) | Evento | Pasajeros | Programa | Experiencia |
 * | Tu gran día (`despegue`) | Programa | Pasajeros | Evento | Experiencia |
 * | Experiencia (`en-vuelo`) | Experiencia | Programa | Pasajeros | Evento |
 *
 * Intención:
 * - **check-in:** armar destino e invitados primero.
 * - **despegue:** el día M importa → programa y coordinación de pasajeros antes que retoques de evento.
 * - **en-vuelo:** disfrute y compartir → experiencia arriba; datos base al final como soporte.
 */
export function getPhaseBaseOrder(phase: JourneyPhaseId): Record<JourneyCardKey, number> {
  switch (phase) {
    case "despegue":
      return { programa: 0, pasajeros: 1, evento: 2, experiencia: 3 };
    case "en-vuelo":
      return { experiencia: 0, programa: 1, pasajeros: 2, evento: 3 };
    case "check-in":
    default:
      return { evento: 0, pasajeros: 1, programa: 2, experiencia: 3 };
  }
}
