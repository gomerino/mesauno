"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

function subtitleForPath(pathname: string): string {
  if (pathname === "/panel" || pathname === "/panel/" || pathname === "/panel/overview") {
    return "Tu centro de control · cada detalle del viaje";
  }
  if (pathname.startsWith("/panel/evento")) return "Evento, destino y música del viaje";
  if (pathname.startsWith("/panel/invitados/confirmaciones")) return "¿Van o no van? · respuestas de tus invitados";
  if (pathname.startsWith("/panel/invitados/vista")) return "Vista previa del pase y la invitación";
  if (pathname.startsWith("/panel/invitados")) return "Quién vuela con ustedes en este viaje";
  if (pathname.startsWith("/panel/invitacion")) return "Invitaciones y experiencia para quienes vienen";
  if (pathname.startsWith("/panel/programa")) return "Itinerario del gran día";
  if (pathname.startsWith("/panel/equipo")) return "Equipo y permisos";
  if (pathname.startsWith("/panel/finanzas")) return "Regalos y números";
  if (pathname.startsWith("/panel/pareja-evento")) return "Tu pareja y el evento";
  return "Seguí armando tu viaje con calma";
}

function isPanelHome(pathname: string): boolean {
  return pathname === "/panel" || pathname === "/panel/" || pathname === "/panel/overview";
}

export function JourneyHeader() {
  const pathname = usePathname() ?? "/panel";
  const subtitle = useMemo(() => subtitleForPath(pathname), [pathname]);
  const home = isPanelHome(pathname);

  return (
    <header
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_0_40px_rgba(212,175,55,0.06)] backdrop-blur-md transition-all duration-500 ${
        home ? "mb-8 px-4 py-5 sm:px-6 sm:py-6" : "mb-5 px-3 py-3 sm:px-4 sm:py-4"
      }`}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-[#D4AF37]/[0.07] blur-3xl animate-journeyGlowPulse"
        aria-hidden
      />
      <div className={`relative flex flex-col gap-3 sm:flex-row sm:items-start ${home ? "sm:gap-6" : "sm:gap-4"}`}>
        <div
          className={`flex shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/20 to-transparent shadow-[0_8px_32px_rgba(212,175,55,0.15)] ${home ? "h-14 w-14" : "h-10 w-10"}`}
          aria-hidden
        >
          <svg
            viewBox="0 0 24 24"
            className={`text-[#D4AF37] animate-journeyPlaneFloat ${home ? "h-8 w-8" : "h-6 w-6"}`}
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]/80">Viaje</p>
          <h1
            className={`mt-1 font-display font-bold leading-tight tracking-tight text-white ${
              home ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"
            }`}
          >
            Tu viaje está listo para despegar
          </h1>
          <p
            className={`max-w-xl text-slate-400 transition-opacity duration-300 ${
              home ? "mt-2 text-sm leading-relaxed" : "mt-1 text-xs leading-snug sm:text-sm"
            }`}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </header>
  );
}
