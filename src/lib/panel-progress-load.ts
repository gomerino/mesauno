import type { SupabaseClient } from "@supabase/supabase-js";
import { selectEventoForMember } from "@/lib/evento-membership";
import {
  getPanelSetupProgress,
  type PanelStepId,
} from "@/lib/panel-setup-progress";
import { fetchInvitadosPanelRows } from "@/lib/panel-invitados";
import type { Evento, Invitado } from "@/types/database";

export type PanelProgressBundle = {
  pct: number;
  steps: Record<PanelStepId, boolean>;
  evento: Pick<
    Evento,
    "id" | "nombre_novio_1" | "nombre_novio_2" | "fecha_boda" | "fecha_evento"
  > | null;
  invitados: Invitado[];
};

/**
 * Una sola lectura de evento + invitados para progreso y vistas del panel.
 */
export async function loadPanelProgressBundle(
  supabase: SupabaseClient,
  userId: string
): Promise<PanelProgressBundle> {
  const { data: evento } = await selectEventoForMember(
    supabase,
    userId,
    "id, nombre_novio_1, nombre_novio_2, fecha_boda, fecha_evento"
  );

  const { data: invRows } = await fetchInvitadosPanelRows(
    supabase,
    userId,
    evento?.id ?? null,
    "id, rsvp_estado, email_enviado, invitacion_vista",
    { orderBy: false }
  );

  const invitados = (invRows ?? []) as unknown as Invitado[];
  const emailsEnviados = invitados.filter((r) => r.email_enviado === true).length;
  const invitacionesVistas = invitados.filter((r) => r.invitacion_vista === true).length;

  const { pct, steps } = getPanelSetupProgress(evento ?? null, {
    totalInvitados: invitados.length,
    emailsEnviados,
    invitacionesVistas,
  });

  return { pct, steps, evento: evento ?? null, invitados };
}

/** Copy corto tipo growth (no invasivo). */
export function panelGrowthLine(
  pct: number,
  steps: Record<PanelStepId, boolean>
): string {
  if (pct >= 100) {
    return "Todo listo por aquí. Sigue afinando detalles cuando quieras.";
  }
  if (!steps.evento) {
    return "Tu gran día empieza aquí: completa los datos del evento.";
  }
  if (!steps.invitados) {
    return "Ya estás a pocos pasos: añade a tus invitados.";
  }
  if (!steps.compartir) {
    return "Tus invitados están esperando: comparte el enlace o envía la invitación.";
  }
  return "Sigue completando tu evento.";
}

/** Primer paso pendiente (o fino del evento si ya completaste el checklist). */
export function panelNextActionHref(
  steps: Record<PanelStepId, boolean>,
  pct: number
): string {
  if (pct >= 100) {
    return "/panel/evento";
  }
  if (!steps.evento) {
    return "/panel/evento";
  }
  if (!steps.invitados) {
    return "/panel/invitados";
  }
  if (!steps.compartir) {
    return "/panel/invitados/vista";
  }
  return "/panel/overview";
}
