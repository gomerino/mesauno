import type { Config } from "tailwindcss";
import { tokens } from "./styles/tokens";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.ts",
  ],
  theme: {
    extend: {
      keyframes: {
        stampDrop: {
          "0%": { transform: "scale(0.35) rotate(-14deg)", opacity: "0" },
          "70%": { transform: "scale(1.06) rotate(-5deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-8deg)", opacity: "1" },
        },
        slideUpDrawer: {
          from: { transform: "translateY(100%)", opacity: "0.88" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        /** Pase SoftAviation: entrada tipo impresión / acercamiento */
        ticketPrintIn: {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(10px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        onboardingReveal: {
          "0%": { opacity: "0", transform: "scale(0.94) translateY(14px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        /** Check-in guardado: pulso suave tipo “pase validado”. */
        boardingValidated: {
          "0%, 100%": { transform: "scale(1)", filter: "brightness(1)" },
          "40%": { transform: "scale(1.04)", filter: "brightness(1.06)" },
          "70%": { transform: "scale(1)", filter: "brightness(1)" },
        },
        rsvpReveal: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        /** Panel journey: avión suave */
        journeyPlaneFloat: {
          "0%, 100%": { transform: "translateY(0) rotate(-8deg)" },
          "50%": { transform: "translateY(-8px) rotate(4deg)" },
        },
        journeyGlowPulse: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.85" },
        },
        /** Checkout plan: CTA + precio al cambiar selección */
        planCtaSync: {
          "0%": { opacity: "0.88", transform: "scale(0.985)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        postPayReveal: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        /** JUR-28 · microceremonia post-pago (candado → ✦) */
        unlockLockExit: {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(14px)" },
        },
        unlockGlowOnce: {
          "0%": { opacity: "0", transform: "scale(0.4)" },
          "45%": { opacity: "0.5", transform: "scale(1.1)" },
          "100%": { opacity: "0", transform: "scale(2)" },
        },
        unlockSparkleIn: {
          "0%": { opacity: "0", transform: "scale(0) rotate(0deg)" },
          "55%": { opacity: "1", transform: "scale(1.12) rotate(140deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(180deg)" },
        },
        unlockParticle: {
          "0%": { opacity: "0", transform: "scale(0)" },
          "35%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.45)" },
        },
      },
      animation: {
        stampDrop: "stampDrop 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        slideUpDrawer: "slideUpDrawer 0.28s ease-out forwards",
        fadeIn: "fadeIn 0.22s ease-out forwards",
        ticketPrintIn: "ticketPrintIn 0.42s cubic-bezier(0.22, 1, 0.36, 1) both",
        onboardingReveal: "onboardingReveal 0.48s cubic-bezier(0.22, 1, 0.36, 1) both",
        boardingValidated: "boardingValidated 0.85s cubic-bezier(0.22, 1, 0.36, 1) both",
        rsvpReveal: "rsvpReveal 0.26s cubic-bezier(0.22, 1, 0.36, 1) both",
        journeyPlaneFloat: "journeyPlaneFloat 3.2s ease-in-out infinite",
        journeyGlowPulse: "journeyGlowPulse 2.5s ease-in-out infinite",
        planCtaSync: "planCtaSync 0.18s ease-out both",
        postPayReveal: "postPayReveal 0.5s ease-out both",
        unlockLockExit: "unlockLockExit 0.45s ease-in forwards",
        unlockGlowOnce: "unlockGlowOnce 1.15s ease-out forwards",
        unlockSparkleIn: "unlockSparkleIn 1s cubic-bezier(0.22, 1, 0.36, 1) 0.32s both",
        unlockParticle: "unlockParticle 1.1s ease-out forwards",
      },
      colors: {
        jurnex: {
          bg: tokens.colors.bg,
          surface: tokens.colors.surface,
          "surface-hover": tokens.colors.surfaceHover,
          border: tokens.colors.border,
          primary: tokens.colors.primary,
          "primary-soft": tokens.colors.primarySoft,
          secondary: tokens.colors.secondary,
          "text-primary": tokens.colors.textPrimary,
          "text-secondary": tokens.colors.textSecondary,
          "text-muted": tokens.colors.textMuted,
          success: tokens.colors.success,
          error: tokens.colors.error,
          warning: tokens.colors.warning,
        },
        dreams: {
          teal: "#0d9488",
          coral: "#f97316",
          sand: "#fef3c7",
          deep: "#134e4a",
        },
        invite: {
          cream: "#FDFDF5",
          /** Fondo base tema premium (arena sólida, alto contraste) */
          sand: "#F4F1EA",
          gold: "#D4AF37",
          navy: "#1A2B48",
        },
      },
      borderRadius: {
        jurnex: "16px",
        "jurnex-sm": tokens.radius.sm,
        "jurnex-md": tokens.radius.md,
        "jurnex-lg": tokens.radius.lg,
      },
      boxShadow: {
        "jurnex-glow":
          "0 0 24px -8px rgba(47, 230, 195, 0.18), inset 0 1px 0 0 rgba(255,255,255,0.06)",
        "jurnex-glow-hover":
          "0 0 32px -6px rgba(47, 230, 195, 0.28), inset 0 1px 0 0 rgba(255,255,255,0.08)",
        "jurnex-card": "0 8px 40px -12px rgba(0, 0, 0, 0.55)",
      },
      transitionDuration: {
        jurnex: "150ms",
      },
      fontFamily: {
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        inviteSerif: ["var(--font-invite-serif)", "Georgia", "serif"],
        inviteMono: ["var(--font-invite-mono)", "Courier New", "monospace"],
        /** Cuerpo invitación premium: Montserrat vía layout /invitacion */
        inviteBody: ["var(--font-invite-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
