import type { EventoCentroTabId } from "@/components/panel/evento/EventoCentroTabContext";
import type { Evento } from "@/types/database";
import { isEventBasicsComplete, isEventUbicacionHoraComplete } from "@/lib/panel-setup-progress";
import type { PanelProgressBundle } from "@/lib/panel-progress-load";

export type EventoConfigCTAInput = {
  evento: Evento | null;
  bundle: Pick<PanelProgressBundle, "programaHitosCount" | "steps">;
  hasAccess: boolean;
  isAdmin: boolean;
  spotifyConnected: boolean;
  spotifySectionAvailable: boolean;
};

export type EventoConfigCTAResult =
  | { status: "pending"; label: string; action: "tab"; tab: EventoCentroTabId }
  | { status: "pending"; label: string; action: "programa" }
  | { status: "complete" };

/**
 * Siguiente paso de configuración del viaje (solo UI). `complete` = nada pendiente aquí;
 * el usuario puede ir a Pasajeros desde el aviso final, no como CTA principal.
 */
export function getEventoConfigCTA(params: EventoConfigCTAInput): EventoConfigCTAResult {
  const { evento, bundle, hasAccess, isAdmin, spotifyConnected, spotifySectionAvailable } = params;

  if (!isEventBasicsComplete(evento)) {
    return { status: "pending", label: "Completar información", action: "tab", tab: "datos" };
  }

  if (!isEventUbicacionHoraComplete(evento)) {
    return { status: "pending", label: "Definir ubicación", action: "tab", tab: "datos" };
  }

  if (bundle.programaHitosCount === 0) {
    return { status: "pending", label: "Configurar programa", action: "programa" };
  }

  if (spotifySectionAvailable && hasAccess && isAdmin && !spotifyConnected) {
    return { status: "pending", label: "Agregar música", action: "tab", tab: "experiencia" };
  }

  return { status: "complete" };
}

/** Etiqueta del siguiente paso o `null` si la configuración del viaje está lista. */
export function getEventoConfigCTALabel(params: EventoConfigCTAInput): string | null {
  const r = getEventoConfigCTA(params);
  return r.status === "complete" ? null : r.label;
}
