/**
 * Jurnex UI — design tokens (única fuente de verdad para color/radio).
 * Alineado al arte de marca: navy invernal (#03182F) + oro/ámbar cálido (mismo eje cromático que el logotipo).
 * Las utilidades `teal-*` de Tailwind apuntan a esta rampa (ver `tailwind.config.ts`).
 */
export const tokens = {
  colors: {
    /** Deep navy (del SVG maestro) — fondo principal */
    bg: "#03182F",
    surface: "rgba(255,255,255,0.03)",
    surfaceHover: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.08)",
    /** Acento principal: oro/ámbar (viaje, CTAs) — mapea a `teal-*` en tailwind */
    primary: "#E89A1E",
    primarySoft: "rgba(232, 154, 30, 0.16)",
    /** Oro claro — highlight secundario, gradientes con primary */
    secondary: "#E4CE5A",
    textPrimary: "#EAF0F7",
    /** Gris suave — texto secundario (frío para contrastar con el oro) */
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
