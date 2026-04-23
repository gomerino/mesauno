import type { JourneyMissionStep } from "@/components/panel/journey/journey-mission-types";
import type { PanelProgressBundle } from "@/lib/panel-progress-load";
import { JOURNEY_STEP_ORDER, type JourneyStepId } from "@/lib/panel-setup-progress";
import { getJourneyPhasesProgressLines } from "@/lib/journey-cards-progress";

const VIAJE_MISSION_LABELS: Record<JourneyStepId, string> = {
  evento_datos: "Datos",
  evento_ubicacion: "Lugar",
  evento_programa: "Programa",
  evento_musica: "Música",
};

/** Misma lógica que la tarjeta «Viaje» en el home (`JourneyViajeClient`) y el bloque de `/panel/viaje`. */
export function getViajeMissionStripFromSteps(
  journeySteps: Record<JourneyStepId, boolean>
): { steps: JourneyMissionStep[]; doneCount: number; totalCount: number } {
  const firstIncomplete = JOURNEY_STEP_ORDER.findIndex((id) => !journeySteps[id]);

  const steps: JourneyMissionStep[] = JOURNEY_STEP_ORDER.map((id, i) => {
    if (journeySteps[id]) {
      return {
        id,
        label: VIAJE_MISSION_LABELS[id],
        state: "done" as const,
      };
    }
    const state: JourneyMissionStep["state"] = i === firstIncomplete ? "active" : "pending";
    return { id, label: VIAJE_MISSION_LABELS[id], state };
  });

  const doneCount = JOURNEY_STEP_ORDER.filter((id) => journeySteps[id]).length;
  return { steps, doneCount, totalCount: JOURNEY_STEP_ORDER.length };
}

/** Texto del micro bajo el mismo criterio que `getJourneyPhasesProgressLines` (barra del panel). */
export function getViajeMisionMicroFromBundle(bundle: PanelProgressBundle): string {
  const all = JOURNEY_STEP_ORDER.every((id) => bundle.steps[id]);
  if (all) return "Nombres, lugar, programa y música: ficha de viaje al día.";
  const { hint } = getJourneyPhasesProgressLines(bundle);
  return hint ?? "Completá la ficha de tu viaje.";
}
