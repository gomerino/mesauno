import type { PanelProgressBundle } from "@/lib/panel-progress-load";
import { JOURNEY_STEP_ORDER } from "@/lib/panel-setup-progress";

export type JourneyPhasesProgressLines = {
  primary: string;
  hint: string | null;
};

const TOTAL = JOURNEY_STEP_ORDER.length;

/**
 * Progreso alineado con las misiones de configuración del evento (`bundle.steps`).
 */
export function getJourneyPhasesProgressLines(
  bundle: PanelProgressBundle,
  opts?: { planPaid?: boolean }
): JourneyPhasesProgressLines {
  void opts;
  const done = JOURNEY_STEP_ORDER.filter((id) => bundle.steps[id]).length;
  const primary = `${done} de ${TOTAL} listo`;

  let hint: string | null = null;
  if (done < TOTAL) {
    const next = JOURNEY_STEP_ORDER.find((id) => !bundle.steps[id]);
    if (next === "tab_tripulacion") {
      hint = "Completá tripulación: nombres, fechas, lugar y hora.";
    } else if (next === "tab_invitacion") {
      hint = "Escribí el mensaje a invitados (pestaña Invitación).";
    } else if (next === "tab_experiencia") {
      hint = "Añadí al menos un momento al programa y conectá Spotify.";
    }
  }

  return { primary, hint };
}
