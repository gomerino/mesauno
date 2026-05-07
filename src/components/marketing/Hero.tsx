import { BoardingPass } from "@/components/invitacion/BoardingPass";
import { JurnexMark } from "@/components/brand/JurnexMark";
import { CrearMiEventoLink } from "@/components/marketing/CrearMiEventoLink";
import { landingBoardingPassDemo } from "@/components/marketing/boarding-pass-demo";
import { Sparkles } from "lucide-react";
import Link from "next/link";

const HERO_BOARDING_FOOTER_NAVY = "#0a1128";

/**
 * Mismo pase que la invitación (`BoardingPass`), con datos demo.
 */
function HeroTicketFrame() {
  return (
    <div className="relative w-full max-w-sm">
      <div
        className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-teal-400/25 via-transparent to-jurnex-secondary/15 opacity-80 blur-sm"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl shadow-jurnex-card ring-1 ring-jurnex-secondary/25 backdrop-blur-md">
        <BoardingPass variant="jurnex" {...landingBoardingPassDemo} />
        <div className="border-t border-white/12 px-4 py-3" style={{ backgroundColor: HERO_BOARDING_FOOTER_NAVY }}>
          <p className="text-center text-[10px] leading-relaxed text-white/92 sm:text-[11px]">
            Cada invitado, su pase. El mismo cuidado que conduces desde el panel.
          </p>
        </div>
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-jurnex-text-primary/92 sm:justify-end">
        <Sparkles className="h-3.5 w-3.5 text-teal-300" strokeWidth={2} aria-hidden />
        Misma lógica que al crear tu viaje en Jurnex
      </p>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-jurnex-border bg-gradient-to-b from-jurnex-bg via-[#040d18] to-jurnex-bg px-4 pb-16 pt-12 sm:pb-20 sm:pt-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(232,154,30,0.12),transparent_50%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
        <div className="min-w-0 flex-1 text-center lg:text-left">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-teal-100">
            Crea tu viaje
          </p>
          <h1 className="font-display text-[clamp(1.9rem,5.2vw,3.1rem)] font-bold leading-[1.1] tracking-tight text-jurnex-text-primary">
            <span className="text-teal-100">Boda, invitación y tripulación</span> en un solo tablero
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-jurnex-text-primary/88 sm:text-lg lg:mx-0">
            Hoy en Jurnex: onboarding de arranque, <strong className="font-medium text-jurnex-text-primary">panel de novios</strong> (itinerario,
            invitados, recuerdos, regalos) e <strong className="font-medium text-jurnex-text-primary">invitación digital real</strong> con estética
            pase de abordaje, lista para compartir desde móvil o web.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            <CrearMiEventoLink className="w-full sm:w-auto" withEmoji />
            <Link
              href="#invitacion-jurnex"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-jurnex-secondary/35 bg-jurnex-primary/10 px-6 py-3 text-sm font-semibold text-jurnex-text-primary transition hover:bg-jurnex-primary/20 active:scale-[0.99] sm:w-auto"
            >
              Cómo se ve la invitación
            </Link>
            <Link
              href="/#invitacion-jurnex"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-white/18 bg-white/[0.04] px-6 py-3 text-sm font-medium text-jurnex-text-primary/88 transition hover:border-white/28 hover:bg-white/[0.07] hover:text-jurnex-text-primary sm:w-auto"
            >
              Ver boarding pass real <span className="jurnex-cta-emoji ml-2 inline-block">🎫</span>
            </Link>
          </div>
        </div>
        <div className="relative flex w-full flex-col items-center justify-center gap-5 lg:max-w-[24rem] lg:shrink-0 lg:items-end">
          <HeroTicketFrame />
          <div className="w-full max-w-sm rounded-2xl border border-jurnex-secondary/30 bg-[#071b2d] p-4 shadow-jurnex-card sm:p-5">
            <JurnexMark variant="fullPng" className="mx-auto h-auto w-full max-w-[9rem] object-contain" alt="" />
            <p className="mt-2 text-center text-xs leading-relaxed text-jurnex-text-primary/88">
              Diseño premium para una boda organizada: orden al planificar y emoción al compartir la invitación.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
