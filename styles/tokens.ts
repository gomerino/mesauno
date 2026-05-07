/**
 * Jurnex UI — design tokens (color/radio del panel y superficies oscuras).
 * Croma de invitación pública (papel, aviación) en `src/lib/brand-palette.ts` (import en `tailwind.config.ts`).
 * Las utilidades `teal-*` de Tailwind = oro de marca (ver `tailwind.config.ts`).
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
    /** Texto secundario sobre navy — legible también en pie / disclaimers */
    textSecondary: "#C5D4E2",
    textMuted: "#9EADC0",
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
