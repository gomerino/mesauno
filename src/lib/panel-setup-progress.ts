import type { Evento } from "@/types/database";

/**
 * Misiones de configuración del viaje/evento (coherentes en tarjeta Viaje, % panel y CTAs).
 * Cada paso pesa 25% hacia el 100%.
 */
export type JourneyStepId =
  | "evento_datos"
  | "evento_ubicacion"
  | "evento_programa"
  | "evento_musica";

/** @deprecated Usa `JourneyStepId`. */
export type PanelStepId = JourneyStepId;

/** Orden fijo: mismo criterio en `getJourneyProgress`, `bundle.steps` y franja de la tarjeta Viaje. */
export const JOURNEY_STEP_ORDER: JourneyStepId[] = [
  "evento_datos",
  "evento_ubicacion",
  "evento_programa",
  "evento_musica",
];

const ORDER = JOURNEY_STEP_ORDER;

const WEIGHT: Record<JourneyStepId, number> = {
  evento_datos: 25,
  evento_ubicacion: 25,
  evento_programa: 25,
  evento_musica: 25,
};

/** Resumen de invitados (métricas; no forma parte del % de configuración del evento). */
export type PanelSetupSummary = {
  totalInvitados: number;
  emailsEnviados: number;
  invitacionesVistas: number;
  respuestasRsvp: number;
};

/**
 * Evento listo en datos básicos: ambos novios y al menos una fecha.
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

type EventoUbicacion = Pick<Evento, "destino" | "lugar_evento_linea" | "hora_embarque"> | null;

/**
 * Lugar o destino definido + hora de embarque (invitación coherente en tiempo y sitio).
 */
export function isEventUbicacionHoraComplete(evento: EventoUbicacion): boolean {
  if (!evento) return false;
  const lugar = Boolean(evento.destino?.trim() || evento.lugar_evento_linea?.trim());
  const hora = Boolean(evento.hora_embarque?.trim());
  return lugar && hora;
}

/** Lista de invitación “lista” en el sentido operativo (datos + ≥1 invitado). No es paso del % de evento. */
export function isInvitacionLista(
  evento: Pick<Evento, "nombre_novio_1" | "nombre_novio_2" | "fecha_boda" | "fecha_evento"> | null,
  totalInvitados: number
): boolean {
  return isEventBasicsComplete(evento) && totalInvitados >= 1;
}

export type JourneyProgress = {
  pct: number;
  steps: Record<JourneyStepId, boolean>;
  nextStep: JourneyStepId | null;
  remainingSteps: number;
};

/**
 * Progreso del panel y siguiente misión de configuración del evento.
 */
export function getJourneyProgress(
  evento: Pick<
    Evento,
    | "nombre_novio_1"
    | "nombre_novio_2"
    | "fecha_boda"
    | "fecha_evento"
    | "destino"
    | "lugar_evento_linea"
    | "hora_embarque"
  > | null,
  programaHitosCount: number,
  spotifyConnected: boolean
): JourneyProgress {
  const steps: Record<JourneyStepId, boolean> = {
    evento_datos: isEventBasicsComplete(evento),
    evento_ubicacion: isEventUbicacionHoraComplete(evento),
    evento_programa: programaHitosCount > 0,
    evento_musica: spotifyConnected,
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
  evento: Parameters<typeof getJourneyProgress>[0],
  programaHitosCount: number,
  spotifyConnected: boolean
): { pct: number; steps: Record<JourneyStepId, boolean> } {
  const j = getJourneyProgress(evento, programaHitosCount, spotifyConnected);
  return { pct: j.pct, steps: j.steps };
}
