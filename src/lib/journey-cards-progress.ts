import type { PanelProgressBundle } from "@/lib/panel-progress-load";
import { isEventBasicsComplete } from "@/lib/panel-setup-progress";

export type JourneyPhasesProgressLines = {
  primary: string;
  hint: string | null;
};

const TOTAL = 4;

/**
 * Progreso alineado con las 4 cards del home (Evento, Pasajeros, Programa, Experiencia).
 */
export function getJourneyPhasesProgressLines(
  bundle: PanelProgressBundle,
  opts?: { planPaid?: boolean }
): JourneyPhasesProgressLines {
  const evento = bundle.evento;
  const programaHitosCount = bundle.programaHitosCount;
  const planPaid =
    opts?.planPaid !== undefined ? opts.planPaid : evento?.plan_status === "paid";

  const eventoOk = isEventBasicsComplete(evento);
  const pasajerosOk = bundle.invitados.length >= 1;
  const programaOk = programaHitosCount >= 1;
  const experienciaOk = Boolean(planPaid);

  const done = [eventoOk, pasajerosOk, programaOk, experienciaOk].filter(Boolean).length;
  const primary = `${done} de ${TOTAL} listo`;

  let hint: string | null = null;
  if (done < TOTAL) {
    if (!eventoOk) {
      hint = "Completá nombres y fecha del evento.";
    } else if (!pasajerosOk) {
      hint = "Te falta invitar 1 persona.";
    } else if (!programaOk) {
      hint = "Añadí momentos al programa del día.";
    } else if (!experienciaOk) {
      hint = "Activá la experiencia para compartir el viaje completo.";
    }
  }

  return { primary, hint };
}
