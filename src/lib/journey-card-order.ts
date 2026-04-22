import type { JourneyPhaseId } from "@/lib/journey-phases";

/**
 * Identificadores de las 4 tarjetas del home del viaje (`JourneyViajeClient`).
 * El orden en pantalla es fijo (ver `getPhaseBaseOrder`).
 */
export type JourneyCardKey = "evento" | "pasajeros" | "programa" | "experiencia";

/**
 * Prioridad base: número menor = más arriba en la grilla antes de aplicar penalización por estado.
 * Orden fijo en todas las fases: Viaje → Pasajeros → Experiencia → Programa.
 */
export function getPhaseBaseOrder(_phase: JourneyPhaseId): Record<JourneyCardKey, number> {
  return { evento: 0, pasajeros: 1, experiencia: 2, programa: 3 };
}
