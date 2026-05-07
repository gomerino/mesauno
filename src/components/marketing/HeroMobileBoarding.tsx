"use client";

import { DEMO_URL, tieneUrlInvitacionDemo, withJurnexTheme } from "@/lib/demo-invitation-public-url";
import Link from "next/link";

const HERO_BOARDING_FOOTER_NAVY = "#0a1128";
const FALLBACK_IFRAME_SRC = "/invitacion/demo?embed=1";

/**
 * Marco ~380px: el iframe reporta ancho móvil y muestra la invitación pública de ejemplo
 * (`NEXT_PUBLIC_DEMO_INVITATION_URL`) si está definida; si no, `/invitacion/demo?embed=1`.
 */
export function HeroMobileBoarding() {
  const configurada = tieneUrlInvitacionDemo();
  const showcaseUrl = configurada ? withJurnexTheme(DEMO_URL) : "";
  const iframeSrc = configurada ? showcaseUrl : FALLBACK_IFRAME_SRC;
  const pantallaCompletaHref = configurada ? showcaseUrl : "/invitacion/demo";

  return (
    <div
      className="group relative mx-auto w-full max-w-[380px] rounded-[1.85rem] bg-[#050f1c] p-[3px] shadow-[0_16px_48px_-14px_rgba(0,0,0,0.65)] ring-1 ring-white/12 transition duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_24px_56px_-16px_rgba(232,154,30,0.2)] lg:mx-0 lg:ml-auto"
      role="figure"
      aria-label="Vista previa de la invitación demo"
    >
      <div
        className="pointer-events-none absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-teal-400/15 via-transparent to-jurnex-secondary/10 opacity-70 blur-md transition-opacity duration-300 group-hover:opacity-90"
        aria-hidden
      />
      <div className="relative z-[1] overflow-hidden rounded-[1.65rem] bg-jurnex-bg">
        <iframe
          title="Demo invitación Jurnex en vista móvil"
          src={iframeSrc}
          className="pointer-events-auto block h-[min(520px,68svh)] w-full border-0 sm:h-[560px]"
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="relative z-[2] border-t border-white/12 px-4 py-3" style={{ backgroundColor: HERO_BOARDING_FOOTER_NAVY }}>
          {configurada ? (
            <a
              href={pantallaCompletaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-[10px] font-medium leading-relaxed text-white/92 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-teal-400/45 sm:text-[11px]"
            >
              Abrir en pantalla completa →
            </a>
          ) : (
            <Link
              href={pantallaCompletaHref}
              className="block text-center text-[10px] font-medium leading-relaxed text-white/92 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-teal-400/45 sm:text-[11px]"
            >
              Abrir demo interactiva →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
