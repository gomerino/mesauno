import { CrearMiEventoLink } from "@/components/marketing/CrearMiEventoLink";

/** CTA intermedia tras la demo (misma acción que el hero). */
export function LandingMidCta() {
  return (
    <section className="border-b border-white/10 bg-[#0b1120] px-4 py-12 sm:py-14">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <p className="text-sm text-slate-400">¿Listo para el tuyo?</p>
        <CrearMiEventoLink className="w-full max-w-sm sm:w-auto" />
      </div>
    </section>
  );
}
