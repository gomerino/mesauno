import type { JourneyPhaseId } from "@/lib/journey-phases";

/**
 * Identificadores de las tarjetas del home del viaje (`JourneyViajeClient`).
 * El orden en pantalla es fijo (ver `getPhaseBaseOrder`).
 */
export type JourneyCardKey = "evento" | "pasajeros" | "experiencia";

/**
 * Prioridad base: número menor = más arriba en la grilla antes de aplicar penalización por estado.
 * Orden fijo en todas las fases: Viaje → Pasajeros → Aterrizaje (key interna: `experiencia`).
 */
export function getPhaseBaseOrder(_phase: JourneyPhaseId): Record<JourneyCardKey, number> {
  return { evento: 0, pasajeros: 1, experiencia: 2 };
}
