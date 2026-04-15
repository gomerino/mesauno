import type { Evento } from "@/types/database";

/** Pasos del journey del panel (sin tocar `/invitacion/*`). */
export type JourneyStepId =
  | "evento"
  | "invitados"
  | "invitacion_lista"
  | "invitacion_compartida"
  | "seguimiento";

/** @deprecated Usa `JourneyStepId`. */
export type PanelStepId = JourneyStepId;

const ORDER: JourneyStepId[] = [
  "evento",
  "invitados",
  "invitacion_lista",
  "invitacion_compartida",
  "seguimiento",
];

const WEIGHT: Record<JourneyStepId, number> = {
  evento: 20,
  invitados: 20,
  invitacion_lista: 20,
  invitacion_compartida: 20,
  seguimiento: 20,
};

export type PanelSetupSummary = {
  totalInvitados: number;
  emailsEnviados: number;
  invitacionesVistas: number;
  /** Invitados con RSVP distinto de pendiente / null. */
  respuestasRsvp: number;
};

/**
 * Evento listo: nombres de ambos novios y al menos una fecha.
 */
export function isEventBasicsComplete(
  evento: Pick<Evento, "nombre_novio_1" | "nombre_novio_2" | "fecha_boda" | "fecha_evento"> | null
): boolean {
  if (!evento) return false;
  const n1 = evento.nombre_novio_1?.trim();
  const n2 = evento.nombre_novio_2?.trim();
  const hasDate = Boolean(
    (evento.fecha_boda && String(evento.fecha_boda).trim()) ||
      (evento.fecha_evento && String(evento.fecha_evento).trim())
  );
  return Boolean(n1 && n2 && hasDate);
}

function isInvitacionLista(
  evento: Pick<Evento, "nombre_novio_1" | "nombre_novio_2" | "fecha_boda" | "fecha_evento"> | null,
  totalInvitados: number
): boolean {
  return isEventBasicsComplete(evento) && totalInvitados >= 1;
}

function isInvitacionCompartida(summary: PanelSetupSummary): boolean {
  return summary.emailsEnviados > 0 || summary.invitacionesVistas > 0;
}

function isSeguimientoActivo(summary: PanelSetupSummary): boolean {
  return summary.respuestasRsvp > 0;
}

export type JourneyProgress = {
  pct: number;
  steps: Record<JourneyStepId, boolean>;
  /** Primer paso aún en false, o null si el journey está completo. */
  nextStep: JourneyStepId | null;
  remainingSteps: number;
};

/**
 * Progreso y siguiente paso del journey (fuente única de verdad).
 */
export function getJourneyProgress(
  evento: Pick<Evento, "nombre_novio_1" | "nombre_novio_2" | "fecha_boda" | "fecha_evento"> | null,
  summary: PanelSetupSummary
): JourneyProgress {
  const steps: Record<JourneyStepId, boolean> = {
    evento: isEventBasicsComplete(evento),
    invitados: summary.totalInvitados >= 1,
    invitacion_lista: isInvitacionLista(evento, summary.totalInvitados),
    invitacion_compartida: isInvitacionCompartida(summary),
    seguimiento: isSeguimientoActivo(summary),
  };

  let pct = 0;
  (Object.keys(WEIGHT) as JourneyStepId[]).forEach((id) => {
    if (steps[id]) pct += WEIGHT[id];
  });

  let nextStep: JourneyStepId | null = null;
  for (const id of ORDER) {
    if (!steps[id]) {
      nextStep = id;
      break;
    }
  }

  const remainingSteps = ORDER.filter((id) => !steps[id]).length;

  return { pct, steps, nextStep, remainingSteps };
}

/** Compat: nombre anterior en el código. */
export function getPanelSetupProgress(
  evento: Pick<Evento, "nombre_novio_1" | "nombre_novio_2" | "fecha_boda" | "fecha_evento"> | null,
  summary: PanelSetupSummary
): { pct: number; steps: Record<JourneyStepId, boolean> } {
  const j = getJourneyProgress(evento, summary);
  return { pct: j.pct, steps: j.steps };
}
