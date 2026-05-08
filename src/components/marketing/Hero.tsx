import { HeroMobileBoarding } from "@/components/marketing/HeroMobileBoarding";
import { panelCtaJurnexPrimary } from "@/components/panel/ds";
import { Plane } from "lucide-react";
import Link from "next/link";

/**
 * Server Component: h1, subtítulo y CTA en HTML inicial. BoardingPass a la derecha (cliente).
 */
export function Hero() {
  return (
    <section className="relative overflow-x-hidden border-b border-jurnex-border bg-gradient-to-b from-jurnex-bg via-[#040d18] to-jurnex-bg px-4 pb-16 pt-12 sm:pb-20 sm:pt-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(232,154,30,0.12),transparent_50%)]"
        aria-hidden
      />
      <div className="relative isolate mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="order-1 min-w-0 text-center lg:z-0 lg:max-w-xl lg:text-left">
          <h1 className="font-display text-[clamp(1.85rem,5vw,2.85rem)] font-bold leading-[1.12] tracking-tight text-jurnex-text-primary">
            Invitaciones digitales para matrimonios con RSVP, programa y experiencia interactiva
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-jurnex-text-primary/88 sm:text-lg lg:mx-0">
            Organiza tu matrimonio sin caos
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            <Link
              href="/onboarding"
              className={
                panelCtaJurnexPrimary +
                " jurnex-cta-pulse inline-flex min-h-[52px] w-full items-center justify-center gap-2 px-8 py-3.5 text-base font-bold tracking-wide sm:w-auto sm:px-10"
              }
            >
              Crear mi viaje
              <Plane className="h-5 w-5 shrink-0 stroke-[2.25]" aria-hidden />
            </Link>
          </div>
        </div>
        <div className="order-2 flex w-full justify-center lg:relative lg:z-10 lg:justify-end">
          <HeroMobileBoarding />
        </div>
      </div>
    </section>
  );
}
