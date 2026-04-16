import type { LucideIcon } from "lucide-react";
import { CalendarDays, Home, Mail, MapPin, Settings2 } from "lucide-react";

/** Entradas de navegación desktop: rutas siguen existiendo; algunas se ocultan del menú (acceso vía cards en inicio). */
export type PanelSidebarItem = {
  href: string;
  label: string;
  end?: boolean;
  /** No mostrar en sidebar ni en barra móvil inferior. */
  hideInNav?: boolean;
};

export const PANEL_SIDEBAR_ITEMS: PanelSidebarItem[] = [
  { href: "/panel", label: "Viaje", end: true },
  { href: "/panel/evento", label: "Evento" },
  { href: "/panel/programa", label: "Programa" },
  { href: "/panel/invitacion", label: "Invitaciones" },
  { href: "/panel/invitados", label: "Pasajeros", hideInNav: true },
  { href: "/panel/experiencia", label: "Experiencia", hideInNav: true },
  { href: "/panel/finanzas", label: "Regalos", hideInNav: true },
  { href: "/panel/invitados/confirmaciones", label: "¿Van o no van?" },
  { href: "/panel/invitados/vista", label: "Vista previa" },
  { href: "/panel/equipo", label: "Ajustes" },
  { href: "/marketplace", label: "Marketplace" },
];

export function panelSidebarVisibleItems(): PanelSidebarItem[] {
  return PANEL_SIDEBAR_ITEMS.filter((i) => !i.hideInNav);
}

/** Barra inferior móvil: pocas entradas; pasajeros / experiencia / regalos solo desde cards o URLs directas. */
export type PanelMobileTab = { href: string; label: string; icon: LucideIcon; end?: boolean };

export const PANEL_MOBILE_TABS: PanelMobileTab[] = [
  { href: "/panel", label: "Viaje", icon: Home, end: true },
  { href: "/panel/evento", label: "Evento", icon: MapPin },
  { href: "/panel/programa", label: "Día", icon: CalendarDays },
  { href: "/panel/invitacion", label: "Invit.", icon: Mail },
  { href: "/panel/equipo", label: "Ajustes", icon: Settings2 },
];
