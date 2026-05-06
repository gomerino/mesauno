import { CrearMiEventoLink } from "@/components/marketing/CrearMiEventoLink";

/** CTA intermedia enfocada en activar el evento, sin desviar flujo. */
export function LandingMidCta() {
  return (
    <section className="border-b border-jurnex-border bg-jurnex-surface/30 px-4 py-12 sm:py-14">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <p className="text-sm text-jurnex-text-secondary">
          Empieza hoy y tendrás tu boarding pass con look premium listo para compartir en minutos.
        </p>
        <div className="flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <CrearMiEventoLink className="w-full sm:w-auto" withEmoji />
        </div>
      </div>
    </section>
  );
}
