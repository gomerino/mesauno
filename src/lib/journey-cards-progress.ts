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
    if (next === "evento_datos") {
      hint = "Completa nombres y fecha del evento.";
    } else if (next === "evento_ubicacion") {
      hint = "Indica lugar o destino y hora del evento.";
    } else if (next === "evento_programa") {
      hint = "Añade momentos al programa del día.";
    } else if (next === "evento_musica") {
      hint = "Conecta Spotify para la playlist del viaje.";
    }
  }

  return { primary, hint };
}
