/**
 * Temas de acento del panel (solo UI del panel; no altera `/invitacion/*`).
 * Persistencia: `localStorage` bajo {@link JOURNEY_THEME_STORAGE_KEY}.
 * Migración automática desde `dreams.panel.theme` (teal / gold / rose).
 */

export const JOURNEY_THEME_STORAGE_KEY = "journey_theme";

/** @deprecated Migración desde versión anterior; leer solo para importar valor. */
export const LEGACY_PANEL_THEME_STORAGE_KEY = "dreams.panel.theme";

export const JOURNEY_THEME_CHANGE_EVENT = "dreams:panel-theme-change";

export const JOURNEY_THEMES = [
  {
    id: "relax" as const,
    label: "✈️ Relax",
    /** Texto corto para chips compactos en el panel. */
    chipLabel: "Relax",
    description: "Calma y claridad",
    accent: "#E89A1E",
  },
  {
    id: "fiesta" as const,
    label: "✨ Fiesta",
    chipLabel: "Fiesta",
    description: "Calidez festiva",
    accent: "#E4CE5A",
  },
  {
    id: "intimo" as const,
    label: "🌙 Íntimo",
    chipLabel: "Íntimo",
    description: "Suave y cercano",
    accent: "#fb7185",
  },
] as const;

export type JourneyThemeId = (typeof JOURNEY_THEMES)[number]["id"];

/** Compat: tipo anterior `teal` | `gold` | `rose`. */
export type LegacyPanelThemeId = "teal" | "gold" | "rose";

export function isJourneyThemeId(v: string | null): v is JourneyThemeId {
  return v === "relax" || v === "fiesta" || v === "intimo";
}

function legacyToJourney(legacy: string | null): JourneyThemeId | null {
  if (legacy === "teal") return "relax";
  if (legacy === "gold") return "fiesta";
  if (legacy === "rose") return "intimo";
  return null;
}

/** Lectura en cliente; en SSR devolver fallback. */
export function readJourneyThemeFromStorage(): JourneyThemeId {
  if (typeof window === "undefined") return "relax";
  try {
    const cur = localStorage.getItem(JOURNEY_THEME_STORAGE_KEY);
    if (isJourneyThemeId(cur)) return cur;

    const migrated = legacyToJourney(localStorage.getItem(LEGACY_PANEL_THEME_STORAGE_KEY));
    if (migrated) {
      localStorage.setItem(JOURNEY_THEME_STORAGE_KEY, migrated);
      return migrated;
    }
  } catch {
    /* ignore */
  }
  return "relax";
}

export function persistJourneyTheme(id: JourneyThemeId): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(JOURNEY_THEME_STORAGE_KEY, id);
    window.dispatchEvent(new Event(JOURNEY_THEME_CHANGE_EVENT));
  } catch {
    /* ignore */
  }
}

/** Shell: glow ambiental fijo. */
export function journeyAmbientGlowClass(theme: JourneyThemeId): string {
  switch (theme) {
    case "relax":
      return "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.1),transparent)]";
    case "fiesta":
      return "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(245,196,81,0.14),transparent)]";
    case "intimo":
      return "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,113,133,0.07),transparent)]";
    default:
      return "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(245,196,81,0.08),transparent)]";
  }
}

/** Nav item activo (sidebar). */
export function journeyNavActiveClasses(theme: JourneyThemeId): string {
  switch (theme) {
    case "relax":
      return "border-teal-400/35 bg-teal-500/10 font-medium text-teal-200";
    case "fiesta":
      return "border-[#F5C451]/40 bg-[#F5C451]/14 font-medium text-[#F5D78A]";
    case "intimo":
      return "border-rose-400/30 bg-rose-950/30 font-medium text-rose-100";
    default:
      return "border-[#F5C451]/30 bg-[#F5C451]/10 font-medium text-[#F5C451]";
  }
}

/** Barra inferior móvil: ítem activo. */
export function journeyMobileNavActiveClass(theme: JourneyThemeId): string {
  switch (theme) {
    case "relax":
      return "text-teal-300";
    case "fiesta":
      return "text-[#F5D78A]";
    case "intimo":
      return "text-rose-300";
    default:
      return "text-[#F5C451]";
  }
}

export function journeyPublicLinkHoverClass(theme: JourneyThemeId): string {
  switch (theme) {
    case "relax":
      return "hover:text-teal-300/90";
    case "fiesta":
      return "hover:text-[#F5C451]/90";
    case "intimo":
      return "hover:text-rose-300/90";
    default:
      return "hover:text-[#F5C451]/90";
  }
}

/** JourneyHeader: acentos suaves por tema (sin cambiar estructura). */
export function journeyHeaderAccentClasses(theme: JourneyThemeId): {
  headerShadow: string;
  orb: string;
  iconBox: string;
  plane: string;
  eyebrow: string;
} {
  switch (theme) {
    case "relax":
      return {
        headerShadow: "shadow-[0_0_40px_rgba(232,154,30,0.1)]",
        orb: "bg-teal-400/[0.07]",
        iconBox:
          "border-teal-400/30 bg-gradient-to-br from-teal-400/20 to-transparent shadow-[0_8px_32px_rgba(232,154,30,0.16)]",
        plane: "text-teal-400",
        eyebrow: "text-teal-300/85",
      };
    case "fiesta":
      return {
        headerShadow: "shadow-[0_0_48px_rgba(245,196,81,0.12)]",
        orb: "bg-[#F5C451]/[0.09]",
        iconBox:
          "border-[#F5C451]/35 bg-gradient-to-br from-[#F5C451]/25 to-transparent shadow-[0_10px_36px_rgba(245,196,81,0.22)]",
        plane: "text-[#F5C451]",
        eyebrow: "text-[#F5C451]/90",
      };
    case "intimo":
      return {
        headerShadow: "shadow-[0_0_40px_rgba(251,113,133,0.06)]",
        orb: "bg-rose-400/[0.06]",
        iconBox:
          "border-rose-400/25 bg-gradient-to-br from-rose-500/15 to-transparent shadow-[0_8px_28px_rgba(251,113,133,0.12)]",
        plane: "text-rose-300",
        eyebrow: "text-rose-300/85",
      };
    default:
      return {
        headerShadow: "shadow-[0_0_40px_rgba(245,196,81,0.06)]",
        orb: "bg-[#F5C451]/[0.07]",
        iconBox:
          "border-[#F5C451]/30 bg-gradient-to-br from-[#F5C451]/20 to-transparent shadow-[0_8px_32px_rgba(245,196,81,0.15)]",
        plane: "text-[#F5C451]",
        eyebrow: "text-[#F5C451]/80",
      };
  }
}

/** @deprecated Usar {@link isJourneyThemeId} y {@link JOURNEY_THEME_STORAGE_KEY}. */
export const PANEL_THEME_STORAGE_KEY = LEGACY_PANEL_THEME_STORAGE_KEY;

/** @deprecated Usar {@link JOURNEY_THEMES}. */
export const PANEL_THEMES = [
  { id: "teal" as const, label: "Brisa", description: "Calma y claridad", accent: "#E89A1E" },
  { id: "gold" as const, label: "Celebración", description: "Calidez festiva", accent: "#E4CE5A" },
  { id: "rose" as const, label: "Romántico", description: "Suave y cercano", accent: "#fb7185" },
] as const;

/** @deprecated Usar {@link JourneyThemeId}. */
export type PanelThemeId = (typeof PANEL_THEMES)[number]["id"];

/** @deprecated */
export function isPanelThemeId(v: string | null): v is PanelThemeId {
  return v === "teal" || v === "gold" || v === "rose";
}
