import type { JourneyMissionStep } from "@/components/panel/journey/journey-mission-types";
import { deriveEstadoEnvio } from "@/lib/invitado-estado-envio";
import type { Evento, Invitado } from "@/types/database";

/** Pasos de la misión Invitados (franja de la tarjeta y página Pasajeros). */
export type GuestMissionStepId =
  | "invitados_lista"
  | "invitados_mesas"
  | "invitados_envio"
  | "invitados_meta";

export const GUEST_MISSION_ORDER: GuestMissionStepId[] = [
  "invitados_lista",
  "invitados_mesas",
  "invitados_envio",
  "invitados_meta",
];

export const GUEST_MISSION_LABELS: Record<GuestMissionStepId, string> = {
  invitados_lista: "Lista",
  invitados_mesas: "Mesas",
  invitados_envio: "Envío",
  invitados_meta: "Meta",
};

/** Personas por fila: titular + acompañantes (tabla o legado). */
export function countPersonasPorInvitado(i: Pick<Invitado, "invitado_acompanantes" | "nombre_acompanante">): number {
  const n = i.invitado_acompanantes?.length ?? 0;
  if (n > 0) return 1 + n;
  if (i.nombre_acompanante?.trim()) return 2;
  return 1;
}

export function totalPersonasEnLista(
  invitados: Pick<Invitado, "invitado_acompanantes" | "nombre_acompanante">[]
): number {
  return invitados.reduce((acc, row) => acc + countPersonasPorInvitado(row), 0);
}

function tieneMesaAsignada(invitados: Pick<Invitado, "asiento">[]): boolean {
  return invitados.some((r) => Boolean(r.asiento?.trim()));
}

/**
 * Misma regla que `getInvitacionesMetricas` / `useInvitaciones` en Pasajeros:
 * el paso «Envío» se cumple si al menos un invitado ya no está en `pendiente`
 * (incluye enviado, abierto, confirmado vía `deriveEstadoEnvio`).
 */
function misionPasoEnvioCumplido(invitados: Invitado[]): boolean {
  if (invitados.length === 0) return false;
  return invitados.some((r) => deriveEstadoEnvio(r) !== "pendiente");
}

/**
 * Meta de cupo: si no hay objetivos (>0), el paso cuenta como hecho.
 * Si hay objetivo de invitaciones o personas, debe cumplirse frente a la lista actual.
 */
export function isGuestMetaStepComplete(
  evento: Pick<Evento, "objetivo_invitaciones_enviar" | "objetivo_personas_total"> | null,
  invitados: Pick<Invitado, "invitado_acompanantes" | "nombre_acompanante">[]
): boolean {
  const oInv = evento?.objetivo_invitaciones_enviar ?? null;
  const oPer = evento?.objetivo_personas_total ?? null;
  const tieneInv = oInv != null && oInv > 0;
  const tienePer = oPer != null && oPer > 0;
  if (!tieneInv && !tienePer) return true;
  let ok = true;
  if (tieneInv) ok = ok && invitados.length >= (oInv as number);
  if (tienePer) ok = ok && totalPersonasEnLista(invitados) >= (oPer as number);
  return ok;
}

export type GuestMissionSteps = Record<GuestMissionStepId, boolean>;

/** Props para `JourneyMissionStrip` (tarjeta Invitados y página Pasajeros). */
export function guestMissionStripProps(steps: GuestMissionSteps): {
  steps: JourneyMissionStep[];
  doneCount: number;
  totalCount: number;
} {
  const firstIncomplete = GUEST_MISSION_ORDER.findIndex((id) => !steps[id]);
  const journeySteps: JourneyMissionStep[] = GUEST_MISSION_ORDER.map((id, i) => {
    if (steps[id]) {
      return { id, label: GUEST_MISSION_LABELS[id], state: "done" as const };
    }
    const state: JourneyMissionStep["state"] = i === firstIncomplete ? "active" : "pending";
    return { id, label: GUEST_MISSION_LABELS[id], state };
  });
  const doneCount = GUEST_MISSION_ORDER.filter((id) => steps[id]).length;
  return { steps: journeySteps, doneCount, totalCount: GUEST_MISSION_ORDER.length };
}

export function getGuestMissionSteps(
  invitados: Invitado[],
  evento: Pick<Evento, "objetivo_invitaciones_enviar" | "objetivo_personas_total"> | null
): GuestMissionSteps {
  const lista = invitados.length >= 1;
  const mesas = lista && tieneMesaAsignada(invitados);
  const envio = lista && misionPasoEnvioCumplido(invitados);
  const meta = lista && isGuestMetaStepComplete(evento, invitados);
  return {
    invitados_lista: lista,
    invitados_mesas: mesas,
    invitados_envio: envio,
    invitados_meta: meta,
  };
}

/** @deprecated Preferir `getGuestMissionSteps` + `guestMissionAggregateState`. */
export type GuestMissionState = "empty" | "in_progress" | "completed";

export function guestMissionAggregateState(steps: GuestMissionSteps): GuestMissionState {
  const all = GUEST_MISSION_ORDER.every((id) => steps[id]);
  if (all) return "completed";
  if (!steps.invitados_lista) return "empty";
  return "in_progress";
}

/** Compat: estado único usado antes del strip de 4 pasos. */
export function resolveGuestMissionState(
  invitados: Invitado[],
  evento: Pick<Evento, "objetivo_invitaciones_enviar" | "objetivo_personas_total"> | null
): GuestMissionState {
  return guestMissionAggregateState(getGuestMissionSteps(invitados, evento));
}

export function guestMissionCtaLabelFromSteps(steps: GuestMissionSteps): string {
  const next = GUEST_MISSION_ORDER.find((id) => !steps[id]);
  switch (next) {
    case undefined:
      return "Revisar invitados";
    case "invitados_lista":
      return "Completar lista";
    case "invitados_mesas":
      return "Asignar mesas";
    case "invitados_envio":
      return "Enviar invitaciones";
    case "invitados_meta":
      return "Definir meta";
    default:
      return "Revisar invitados";
  }
}

export function guestMissionDescriptionFromSteps(steps: GuestMissionSteps): string {
  const next = GUEST_MISSION_ORDER.find((id) => !steps[id]);
  switch (next) {
    case undefined:
      return "Lista, mesas, envío y meta ✓";
    case "invitados_lista":
      return "Añade personas a tu lista";
    case "invitados_mesas":
      return "Asigna mesa en cada invitado";
    case "invitados_envio":
      return "Comparte o envía invitaciones";
    case "invitados_meta":
      return "Ajustá la meta en tu viaje o completá la lista";
    default:
      return "Gestioná tu lista";
  }
}

/** Compat: CTA genérico cuando solo tenés el agregado legacy. */
export function guestMissionCtaLabel(state: GuestMissionState): string {
  switch (state) {
    case "empty":
      return "Completar lista";
    case "in_progress":
      return "Seguir invitados";
    case "completed":
      return "Revisar invitados";
    default:
      return "Revisar invitados";
  }
}
