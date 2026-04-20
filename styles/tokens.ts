/**
 * Jurnex UI — design tokens (única fuente de verdad para color/radio).
 * Consumir desde componentes vía `@styles/tokens` y desde Tailwind en `tailwind.config.ts`.
 */
export const tokens = {
  colors: {
    bg: "#060B14",
    surface: "rgba(255,255,255,0.03)",
    surfaceHover: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.08)",
    primary: "#2FE6C3",
    primarySoft: "rgba(47,230,195,0.15)",
    secondary: "#F5C451",
    textPrimary: "#EAF2FF",
    textSecondary: "#8FA3C0",
    textMuted: "#5B6C89",
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
