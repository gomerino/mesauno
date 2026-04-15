import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
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
      },
      animation: {
        stampDrop: "stampDrop 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        slideUpDrawer: "slideUpDrawer 0.28s ease-out forwards",
        fadeIn: "fadeIn 0.22s ease-out forwards",
        ticketPrintIn: "ticketPrintIn 0.42s cubic-bezier(0.22, 1, 0.36, 1) both",
        onboardingReveal: "onboardingReveal 0.48s cubic-bezier(0.22, 1, 0.36, 1) both",
        boardingValidated: "boardingValidated 0.85s cubic-bezier(0.22, 1, 0.36, 1) both",
        rsvpReveal: "rsvpReveal 0.26s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      colors: {
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
