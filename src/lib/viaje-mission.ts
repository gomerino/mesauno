import type { JourneyMissionStep } from "@/components/panel/journey/journey-mission-types";
import type { PanelProgressBundle } from "@/lib/panel-progress-load";
import { JOURNEY_STEP_ORDER, type JourneyStepId } from "@/lib/panel-setup-progress";
import { getJourneyPhasesProgressLines } from "@/lib/journey-cards-progress";

const VIAJE_MISSION_LABELS: Record<JourneyStepId, string> = {
  tab_tripulacion: "Tripulación",
  tab_invitacion: "Invitación",
  tab_experiencia: "Experiencia",
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
    return {
      id,
      label: VIAJE_MISSION_LABELS[id],
      state,
    };
  });

  const doneCount = JOURNEY_STEP_ORDER.filter((id) => journeySteps[id]).length;
  return { steps, doneCount, totalCount: JOURNEY_STEP_ORDER.length };
}

/**
 * Párrafo superior de la caja de misión (bajo el título implícito).
 * Encaja con el siguiente paso pendiente del viaje.
 */
export function getViajeMisionMicroFromBundle(bundle: PanelProgressBundle): string {
  const all = JOURNEY_STEP_ORDER.every((id) => bundle.steps[id]);
  if (all) {
    return "Tres bloques listos. Puedes seguir afinando o ir a invitar pasajeros cuando quieras.";
  }
  const { primary, hint } = getJourneyPhasesProgressLines(bundle);
  if (hint) {
    return `${primary}. ${hint}`;
  }
  return `${primary}. Completá en orden tripulación → invitación → experiencia.`;
}
