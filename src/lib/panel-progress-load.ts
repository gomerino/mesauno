import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { selectEventoForMember } from "@/lib/evento-membership";
import { spotifyGetPanelPublicState } from "@/lib/spotify-credentials";
import { createClient, createStrictServiceClient } from "@/lib/supabase/server";
import {
  getJourneyProgress,
  type JourneyStepId,
} from "@/lib/panel-setup-progress";
import { fetchInvitadosPanelRowsWithAcompanantes } from "@/lib/panel-invitados";
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
    | "hora_embarque"
    | "plan_status"
    | "destino"
    | "lugar_evento_linea"
    | "payment_id"
    | "objetivo_invitaciones_enviar"
    | "objetivo_personas_total"
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
    "id, nombre_novio_1, nombre_novio_2, fecha_boda, fecha_evento, hora_embarque, plan_status, destino, lugar_evento_linea, payment_id, objetivo_invitaciones_enviar, objetivo_personas_total"
  );

  let programaHitosCount = 0;
  if (evento?.id) {
    const { count, error } = await supabase
      .from("evento_programa_hitos")
      .select("id", { count: "exact", head: true })
      .eq("evento_id", evento.id);
    if (!error) programaHitosCount = count ?? 0;
  }

  // Misma query que `/panel/pasajeros` para que `getGuestMissionSteps` coincida con la página.
  const { data: invData, error: invErr } = await fetchInvitadosPanelRowsWithAcompanantes(
    supabase,
    userId,
    evento?.id ?? null,
    { orderBy: false }
  );
  if (invErr) {
    console.error("[loadPanelProgressBundle] invitados:", invErr.message);
  }
  const invitados = (invData ?? []) as unknown as Invitado[];

  let spotifyConnected = false;
  if (evento?.id) {
    const strictDb = await createStrictServiceClient();
    if (strictDb) {
      const st = await spotifyGetPanelPublicState(strictDb, evento.id);
      spotifyConnected = st.connected;
    }
  }

  const j = getJourneyProgress(evento ?? null, programaHitosCount, spotifyConnected);

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
  evento_datos: "completar datos de pareja y fechas del evento",
  evento_ubicacion: "definir lugar o destino y hora",
  evento_programa: "añadir al menos un momento al programa del día",
  evento_musica: "conectar Spotify y tu playlist",
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
    return "/panel/pasajeros";
  }
  switch (nextStep) {
    case "evento_datos":
    case "evento_ubicacion":
      return "/panel/viaje";
    case "evento_programa":
      return "/panel/viaje/programa";
    case "evento_musica":
      return "/panel/experiencia";
    default:
      return "/panel/viaje";
  }
}

export function panelNextActionLabel(nextStep: JourneyStepId | null): string {
  if (nextStep == null) {
    return "Gestionar invitados";
  }
  switch (nextStep) {
    case "evento_datos":
    case "evento_ubicacion":
      return "Completar tu viaje";
    case "evento_programa":
      return "Armar programa";
    case "evento_musica":
      return "Conectar música";
    default:
      return "Continuar";
  }
}
