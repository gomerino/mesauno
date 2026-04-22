/**
 * Jurnex UI — design tokens (única fuente de verdad para color/radio).
 * Alineado a guía de marca: navy profundo, teal viaje, oro emocional, gris suave secundario.
 * Consumir desde componentes vía `@styles/tokens` y desde Tailwind en `tailwind.config.ts`.
 */
export const tokens = {
  colors: {
    /** Deep navy — fondo principal */
    bg: "#0B1220",
    surface: "rgba(255,255,255,0.03)",
    surfaceHover: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.08)",
    /** Teal journey — acentos, CTAs, enlaces */
    primary: "#14B8A6",
    primarySoft: "rgba(20,184,166,0.15)",
    /** Gold emocional — highlights, fase “celebración” */
    secondary: "#F5C451",
    textPrimary: "#EAF2FF",
    /** Gris suave — texto secundario */
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    success: "#22C55E",
    error: "#EF4444",
    warning: "#F59E0B",
  },
  radius: {
    sm: "10px",
    md: "16px",
    lg: "20px",
  },
  motion: {
    duration: "150ms",
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

export type JurnexTokens = typeof tokens;
