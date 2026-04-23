import type { MissionStripProps } from "@/components/panel/journey/journey-mission-types";

export const RECUERDOS_MISSION_EVENT = "jurnex:recuerdos-mission";

/** Paso único de la misión Aterrizaje en el home del viaje. */
const STEP_ID = "recuerdos_descargar_fotos";

const STORAGE_PREFIX = "jurnex:recuerdos_mission_fotos_";

export function recuerdosMissionStorageKey(eventoId: string): string {
  return `${STORAGE_PREFIX}${eventoId}`;
}

export function hasRecuerdosFotosDownloadMisionDone(
  eventoId: string | null | undefined
): boolean {
  if (!eventoId || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(recuerdosMissionStorageKey(eventoId)) === "1";
  } catch {
    return false;
  }
}

/**
 * Marca la misión como completa (tras una descarga ZIP con éxito) y notifica
 * a otras vistas en la misma pestaña (`JourneyHome`).
 */
export function markRecuerdosFotosDownloadMision(eventoId: string): void {
  if (typeof window === "undefined" || !eventoId) return;
  try {
    window.localStorage.setItem(recuerdosMissionStorageKey(eventoId), "1");
    window.dispatchEvent(
      new CustomEvent(RECUERDOS_MISSION_EVENT, { detail: { eventoId } })
    );
  } catch {
    // no-op
  }
}

export function getRecuerdosFotosMissionStrip(
  descargaHecha: boolean
): MissionStripProps {
  return {
    steps: [
      {
        id: STEP_ID,
        label: "Descargar",
        state: descargaHecha ? "done" : "active",
      },
    ],
    doneCount: descargaHecha ? 1 : 0,
    totalCount: 1,
    ariaLabel: "Misión: descargar recuerdos",
  };
}

export function recuerdosMisionCtaLabel(descargaHecha: boolean): string {
  return descargaHecha ? "Revisar recuerdos" : "Descargar fotos";
}

export function recuerdosMisionDescription(descargaHecha: boolean): string {
  return descargaHecha
    ? "Recuerdos listos: ya descargaste al menos un ZIP de fotos"
    : "Bajá las imágenes del evento en un ZIP (todas o por momento)";
}
