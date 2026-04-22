"use client";

import { usePanelJourneyTheme } from "@/components/panel/panel-journey-theme-context";
import { journeyHeaderAccentClasses } from "@/theme/panel-themes";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

function subtitleForPath(pathname: string): string {
  if (pathname === "/panel" || pathname === "/panel/" || pathname === "/panel/overview") {
    return "Tu centro de control · cada detalle del viaje";
  }
  if (pathname.startsWith("/panel/viaje/programa")) return "Itinerario del gran día";
  if (pathname.startsWith("/panel/viaje")) return "Datos, invitación y experiencia del viaje";
  if (pathname.startsWith("/panel/pasajeros/confirmaciones")) return "Confirmaciones · quién viene y quién no";
  if (pathname.startsWith("/panel/pasajeros/vista")) return "Vista previa del pase y la invitación";
  if (pathname.startsWith("/panel/pasajeros/envios")) return "Canales y mensaje de la invitación";
  if (pathname.startsWith("/panel/pasajeros")) return "Lista, envíos y confirmaciones del viaje";
  if (pathname.startsWith("/panel/recuerdos")) return "Lo que queda cuando el viaje aterriza";
  if (pathname.startsWith("/panel/ajustes")) return "Equipo, cuenta y permisos";
  if (pathname.startsWith("/panel/finanzas")) return "Regalos y números";
  if (pathname.startsWith("/panel/pareja-evento")) return "Tu pareja y el evento";
  return "Seguí armando tu viaje con calma";
}

function isPanelHome(pathname: string): boolean {
  return pathname === "/panel" || pathname === "/panel/" || pathname === "/panel/overview";
}

type JourneyHeaderProps = {
  /** Inicio del panel: más chico y liviano (debajo del selector de estilo). */
  variant?: "default" | "compact";
};

export function JourneyHeader({ variant = "default" }: JourneyHeaderProps) {
  const pathname = usePathname() ?? "/panel";
  const subtitle = useMemo(() => subtitleForPath(pathname), [pathname]);
  const home = isPanelHome(pathname);
  const compact = variant === "compact";
  const panelTheme = usePanelJourneyTheme();
  const ac = journeyHeaderAccentClasses(panelTheme);

  return (
    <header
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md transition-all duration-500 ${ac.headerShadow} ${
        compact
          ? "mb-0 px-3 py-2.5 sm:px-4 sm:py-3"
          : home
            ? "mb-6 px-4 py-3 sm:px-5 sm:py-4"
            : "mb-5 px-3 py-3 sm:px-4 sm:py-4"
      }`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full blur-3xl animate-journeyGlowPulse ${ac.orb}`}
        aria-hidden
      />
      <div className={`relative flex flex-col gap-3 sm:flex-row sm:items-start ${home ? "sm:gap-6" : "sm:gap-4"}`}>
        <div
          className={`flex shrink-0 items-center justify-center rounded-2xl border ${ac.iconBox} ${compact ? "h-10 w-10" : home ? "h-12 w-12" : "h-10 w-10"}`}
          aria-hidden
        >
          <svg
            viewBox="0 0 24 24"
            className={`${ac.plane} animate-journeyPlaneFloat ${compact ? "h-6 w-6" : home ? "h-7 w-7" : "h-6 w-6"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-semibold uppercase tracking-[0.28em] ${ac.eyebrow}`}>Viaje</p>
          <h1
            className={`mt-1 font-display font-bold leading-tight tracking-tight text-white ${
              compact ? "text-base sm:text-lg" : home ? "text-xl sm:text-xl" : "text-lg sm:text-xl"
            }`}
          >
            Tu viaje está listo para despegar
          </h1>
          <p
            className={`max-w-xl text-slate-400 transition-opacity duration-300 ${
              compact
                ? "mt-1 text-xs leading-snug opacity-65 sm:text-[13px]"
                : home
                  ? "mt-2 text-sm leading-relaxed opacity-70"
                  : "mt-1 text-xs leading-snug sm:text-sm"
            }`}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </header>
  );
}
