import { BoardingPass } from "@/components/invitacion/BoardingPass";
import { landingBoardingPassDemo } from "@/components/marketing/boarding-pass-demo";
import { panelCtaJurnexPrimary } from "@/components/panel/ds";
import Link from "next/link";

const HERO_BOARDING_FOOTER_NAVY = "#0a1128";

/** Datos demo del hero (mismo contrato que la invitación). */
const demoData = landingBoardingPassDemo;

function HeroBoardingFrame() {
  return (
    <div className="relative w-full max-w-[min(100%,22rem)]">
      <div
        className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-teal-400/25 via-transparent to-jurnex-secondary/15 opacity-80 blur-sm"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl shadow-jurnex-card ring-1 ring-jurnex-secondary/25 backdrop-blur-md">
        <BoardingPass variant="jurnex" {...demoData} />
        <div className="border-t border-white/12 px-4 py-3" style={{ backgroundColor: HERO_BOARDING_FOOTER_NAVY }}>
          <p className="text-center text-[10px] leading-relaxed text-white/92 sm:text-[11px]">
            Así recibe cada invitado su pase en el gran día.
          </p>
        </div>
      </div>
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
      <div className="animate-landingHeroIn relative mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
        <div className="min-w-0 flex-1 text-center lg:max-w-xl lg:text-left">
          <h1 className="font-display text-[clamp(1.85rem,5vw,2.85rem)] font-bold leading-[1.12] tracking-tight text-jurnex-text-primary">
            Organiza tu matrimonio sin caos
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-jurnex-text-primary/88 sm:text-lg lg:mx-0">
            Invitaciones, invitados y experiencia en un solo lugar
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            <Link
              href="#invitacion-jurnex"
              className={
                panelCtaJurnexPrimary +
                " jurnex-cta-pulse inline-flex min-h-[52px] w-full items-center justify-center px-8 py-3.5 text-base font-bold tracking-wide sm:w-auto sm:px-10"
              }
            >
              Ver invitación en vivo
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-white/18 bg-white/[0.06] px-8 py-3.5 text-base font-semibold text-jurnex-text-primary transition hover:border-white/28 hover:bg-white/[0.1] sm:w-auto"
            >
              Crear mi invitación
            </Link>
          </div>
        </div>
        <div className="relative flex w-full flex-col items-center justify-center lg:max-w-[min(100%,24rem)] lg:shrink-0 lg:items-end">
          <HeroBoardingFrame />
        </div>
      </div>
    </section>
  );
}
