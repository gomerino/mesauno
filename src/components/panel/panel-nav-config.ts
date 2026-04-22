import type { LucideIcon } from "lucide-react";
import { Home, Image, Plane, Settings, Users } from "lucide-react";

export type PanelSidebarItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  /** Coincide solo con la ruta exacta (p. ej. panel de control). */
  end?: boolean;
};

const panel: PanelSidebarItem = {
  id: "panel",
  href: "/panel",
  label: "Panel de control",
  icon: Home,
  end: true,
};
const viaje: PanelSidebarItem = { id: "viaje", href: "/panel/viaje", label: "Viaje", icon: Plane };
const pasajeros: PanelSidebarItem = {
  id: "pasajeros",
  href: "/panel/pasajeros",
  label: "Pasajeros",
  icon: Users,
};
const aterrizaje: PanelSidebarItem = {
  id: "aterrizaje",
  href: "/panel/recuerdos",
  label: "Aterrizaje",
  icon: Image,
};
const ajustes: PanelSidebarItem = {
  id: "ajustes",
  href: "/panel/ajustes",
  label: "Ajustes",
  icon: Settings,
};

/** Grupos del sidebar: control · viaje+pasajeros+aterrizaje · ajustes */
export const PANEL_SIDEBAR_GROUPS: PanelSidebarItem[][] = [[panel], [viaje, pasajeros, aterrizaje], [ajustes]];

export const PANEL_SIDEBAR_ITEMS: PanelSidebarItem[] = PANEL_SIDEBAR_GROUPS.flat();

export function panelSidebarVisibleItems(): PanelSidebarItem[] {
  return PANEL_SIDEBAR_ITEMS;
}

export type PanelMobileTab = { href: string; label: string; icon: LucideIcon; end?: boolean };

export const PANEL_MOBILE_TABS: PanelMobileTab[] = [
  { href: "/panel", label: "Panel", icon: Home, end: true },
  { href: "/panel/viaje", label: "Viaje", icon: Plane },
  { href: "/panel/pasajeros", label: "Pasajeros", icon: Users },
  { href: "/panel/recuerdos", label: "Recuerdos", icon: Image },
  { href: "/panel/ajustes", label: "Ajustes", icon: Settings },
];
