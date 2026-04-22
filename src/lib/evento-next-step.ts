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
  hasAccess: boolean;
  isAdmin: boolean;
  spotifyConnected: boolean;
}): EventoNextStep {
  const { evento, invitadosCount, programaHitosCount, hasAccess, isAdmin, spotifyConnected } = params;

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
      href: "/panel/viaje/programa",
    };
  }

  if (!evento?.motivo_viaje?.trim()) {
    return {
      description: "Escribe un mensaje corto que verán en la invitación.",
      action: "Completar mensaje",
      href: "/panel/viaje",
    };
  }

  if (hasAccess && isAdmin && !spotifyConnected) {
    return {
      description: "Conecta música colaborativa y ajusta cómo vive la experiencia tu tripulación.",
      action: "Definir experiencia",
      href: "/panel/experiencia",
    };
  }

  return null;
}
