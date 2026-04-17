import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { selectEventoForMember } from "@/lib/evento-membership";
import { createClient } from "@/lib/supabase/server";
import {
  getJourneyProgress,
  type JourneyStepId,
} from "@/lib/panel-setup-progress";
import { fetchInvitadosPanelRows } from "@/lib/panel-invitados";
import type { Evento, Invitado } from "@/types/database";
import { parseMockPaymentStatusFromPaymentId, type MockPaymentStatus } from "@/lib/mock-payment";

export type PanelProgressBundle = {
  pct: number;
  steps: Record<JourneyStepId, boolean>;
  nextStep: JourneyStepId | null;
  remainingSteps: number;
  evento: Pick<
    Evento,
    | "id"
    | "nombre_novio_1"
    | "nombre_novio_2"
    | "fecha_boda"
    | "fecha_evento"
    | "plan_status"
    | "destino"
    | "payment_id"
  > | null;
  mockPaymentStatus: MockPaymentStatus | null;
  invitados: Invitado[];
  /** Hitos en programa del día (tabla `evento_programa_hitos`). */
  programaHitosCount: number;
};

/**
 * Una sola lectura de evento + invitados para progreso y vistas del panel.
 */
async function loadPanelProgressBundleInner(
  supabase: SupabaseClient,
  userId: string
): Promise<PanelProgressBundle> {
  const { data: evento } = await selectEventoForMember(
    supabase,
    userId,
    "id, nombre_novio_1, nombre_novio_2, fecha_boda, fecha_evento, plan_status, destino, payment_id"
  );

  let programaHitosCount = 0;
  if (evento?.id) {
    const { count, error } = await supabase
      .from("evento_programa_hitos")
      .select("id", { count: "exact", head: true })
      .eq("evento_id", evento.id);
    if (!error) programaHitosCount = count ?? 0;
  }

  const { data: invRows } = await fetchInvitadosPanelRows(
    supabase,
    userId,
    evento?.id ?? null,
    "id, rsvp_estado, email_enviado, invitacion_vista, token_acceso",
    { orderBy: false }
  );

  const invitados = (invRows ?? []) as unknown as Invitado[];
  const emailsEnviados = invitados.filter((r) => r.email_enviado === true).length;
  const invitacionesVistas = invitados.filter((r) => r.invitacion_vista === true).length;
  const respuestasRsvp = invitados.filter(
    (r) => r.rsvp_estado === "confirmado" || r.rsvp_estado === "declinado"
  ).length;

  const j = getJourneyProgress(evento ?? null, {
    totalInvitados: invitados.length,
    emailsEnviados,
    invitacionesVistas,
    respuestasRsvp,
  });

  return {
    pct: j.pct,
    steps: j.steps,
    nextStep: j.nextStep,
    remainingSteps: j.remainingSteps,
    evento: evento ?? null,
    mockPaymentStatus: parseMockPaymentStatusFromPaymentId(
      (evento as { payment_id?: string | null } | null)?.payment_id ?? null
    ),
    invitados,
    programaHitosCount,
  };
}

/**
 * Una sola lectura por request de servidor (deduplicada con React `cache` por `userId`).
 */
export const loadPanelProgressBundle = cache(async (userId: string): Promise<PanelProgressBundle> => {
  const supabase = await createClient();
  return loadPanelProgressBundleInner(supabase, userId);
});

const STEP_DETAIL: Record<JourneyStepId, string> = {
  evento: "completar los datos de tu evento",
  invitados: "añadir a tus invitados",
  invitacion_lista: "revisar tu invitación",
  invitacion_compartida: "compartir tu invitación",
  seguimiento: "ver cómo van las confirmaciones",
};

/** Mensaje principal del journey (home y barra slim). */
export function journeyHeadline(nextStep: JourneyStepId | null, remainingSteps: number): string {
  if (nextStep == null) {
    return "¡Tu gran día va encaminado! Podéis seguir afinando cuando queráis.";
  }
  const n = remainingSteps;
  const prefix = n === 1 ? "Te falta 1 paso" : `Te faltan ${n} pasos`;
  return `${prefix}: ${STEP_DETAIL[nextStep]}.`;
}

/** CTA principal: siguiente pantalla del journey. */
export function panelNextActionHref(nextStep: JourneyStepId | null): string {
  if (nextStep == null) {
    return "/panel/invitados/confirmaciones";
  }
  switch (nextStep) {
    case "evento":
      return "/panel/evento";
    case "invitados":
      return "/panel/invitados";
    case "invitacion_lista":
    case "invitacion_compartida":
      return "/panel/invitacion";
    case "seguimiento":
      return "/panel/invitados/confirmaciones";
    default:
      return "/panel";
  }
}

export function panelNextActionLabel(nextStep: JourneyStepId | null): string {
  if (nextStep == null) {
    return "Ver confirmaciones";
  }
  switch (nextStep) {
    case "evento":
      return "Completar evento";
    case "invitados":
      return "Agregar invitados";
    case "invitacion_lista":
      return "Ver invitación";
    case "invitacion_compartida":
      return "Compartir invitación";
    case "seguimiento":
      return "Ver confirmaciones";
    default:
      return "Continuar";
  }
}
