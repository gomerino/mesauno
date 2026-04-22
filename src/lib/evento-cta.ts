import { getEventoConfigCTA, type EventoConfigCTAInput } from "@/lib/evento-config-cta";

export type EventoStep =
  | "info"
  | "ubicacion"
  | "mensaje"
  | "programa"
  | "invitacion"
  | "spotify"
  | "ready";

export type EventoCentroTabForCta = "datos" | "invitacion" | "experiencia";

export type EventoCTAResult = {
  label: string;
  action: EventoStep;
  variant: "primary" | "secondary";
  /** Ruta absoluta; si es esta vista y hay `tab`, el cliente cambia pestaña. */
  href: string;
  tab?: EventoCentroTabForCta;
};

function mapLabelToStep(label: string): EventoStep {
  switch (label) {
    case "Completar información":
      return "info";
    case "Definir ubicación":
      return "ubicacion";
    case "Escribir mensaje":
      return "mensaje";
    case "Configurar programa":
      return "programa";
    case "Definir invitación":
      return "invitacion";
    case "Agregar música":
      return "spotify";
    default:
      return "info";
  }
}

/**
 * Derivación legacy con mismo orden que `getEventoConfigCTA`. El estado final sigue siendo
 * “listo para invitar” con enlace a Pasajeros (p. ej. otros puntos de entrada).
 */
export function getEventoCTA(params: EventoConfigCTAInput): EventoCTAResult {
  const r = getEventoConfigCTA(params);
  if (r.status === "complete") {
    return {
      label: "Invitar personas",
      action: "ready",
      variant: "primary",
      href: "/panel/pasajeros",
    };
  }
  if (r.action === "programa") {
    return {
      label: r.label,
      action: "programa",
      variant: "primary",
      href: "/panel/viaje/programa",
    };
  }
  const variant: "primary" | "secondary" = r.label === "Agregar música" ? "secondary" : "primary";
  return {
    label: r.label,
    action: mapLabelToStep(r.label),
    variant,
    href: "/panel/viaje",
    tab: r.tab,
  };
}
