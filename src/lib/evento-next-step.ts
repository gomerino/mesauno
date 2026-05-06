import { eventoTienePlanExperienciaProducto } from "@/lib/evento-plan-access";
import type { Evento } from "@/types/database";

export type EventoNextStep = {
  description: string;
  action: string;
  href: string;
} | null;

/**
 * Prioridad: invitados → programa → mensaje → experiencia (Spotify pendiente).
 * Solo UI; no altera datos.
 */
export function resolveEventoNextStep(params: {
  evento: Evento | null;
  invitadosCount: number;
  programaHitosCount: number;
  isAdmin: boolean;
  spotifyConnected: boolean;
}): EventoNextStep {
  const { evento, invitadosCount, programaHitosCount, isAdmin, spotifyConnected } = params;

  if (invitadosCount === 0) {
    return {
      description: "Invita a tus primeros pasajeros para generar invitaciones y seguimiento.",
      action: "Invitar personas",
      href: "/panel/pasajeros",
    };
  }

  if (programaHitosCount === 0) {
    return {
      description: "Añade momentos al programa del día para guiar a tus invitados.",
      action: "Ir al programa",
      href: "/panel/viaje?tab=experiencia",
    };
  }

  if (!evento?.motivo_viaje?.trim()) {
    return {
      description: "Escribe un mensaje corto que verán en la invitación.",
      action: "Completar mensaje",
      href: "/panel/viaje?tab=invitacion",
    };
  }

  if (isAdmin && eventoTienePlanExperienciaProducto(evento) && !spotifyConnected) {
    return {
      description: "Conecta música colaborativa y ajusta cómo vive la experiencia tu tripulación.",
      action: "Definir experiencia",
      href: "/panel/viaje?tab=experiencia",
    };
  }

  return null;
}
