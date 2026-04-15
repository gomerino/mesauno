/**
 * Temas de acento del panel (solo UI; no altera `/invitacion/*`).
 * La selección se guarda en `localStorage` bajo {@link PANEL_THEME_STORAGE_KEY}.
 */
export const PANEL_THEME_STORAGE_KEY = "dreams.panel.theme";

export const PANEL_THEMES = [
  { id: "teal", label: "Brisa", description: "Calma y claridad", accent: "#2dd4bf" },
  { id: "gold", label: "Celebración", description: "Calidez festiva", accent: "#D4AF37" },
  { id: "rose", label: "Romántico", description: "Suave y cercano", accent: "#fb7185" },
] as const;

export type PanelThemeId = (typeof PANEL_THEMES)[number]["id"];

export function isPanelThemeId(v: string | null): v is PanelThemeId {
  return v === "teal" || v === "gold" || v === "rose";
}
