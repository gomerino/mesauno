import type { Evento } from "@/types/database";

export type PanelStepId = "evento" | "invitados" | "compartir";

/** Pesos alineados con workflows/HU-010-panel-optimization/tech.md */
const WEIGHT: Record<PanelStepId, number> = {
  evento: 40,
  invitados: 35,
  compartir: 25,
};

export type PanelSetupSummary = {
  totalInvitados: number;
  emailsEnviados: number;
  invitacionesVistas: number;
};

/**
 * Evento “completo” para el checklist: nombres de ambos novios y al menos una fecha.
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

function isShareComplete(summary: PanelSetupSummary): boolean {
  return summary.emailsEnviados > 0 || summary.invitacionesVistas > 0;
}

export function getPanelSetupProgress(
  evento: Pick<Evento, "nombre_novio_1" | "nombre_novio_2" | "fecha_boda" | "fecha_evento"> | null,
  summary: PanelSetupSummary
): { pct: number; steps: Record<PanelStepId, boolean> } {
  const steps: Record<PanelStepId, boolean> = {
    evento: isEventBasicsComplete(evento),
    invitados: summary.totalInvitados >= 1,
    compartir: isShareComplete(summary),
  };

  let pct = 0;
  (Object.keys(WEIGHT) as PanelStepId[]).forEach((id) => {
    if (steps[id]) pct += WEIGHT[id];
  });

  return { pct, steps };
}
