import { CrearMiEventoLink } from "@/components/marketing/CrearMiEventoLink";

/** CTA intermedia enfocada en activar el evento, sin desviar flujo. */
export function LandingMidCta() {
  return (
    <section className="border-b border-white/[0.08] bg-white/[0.06] px-4 py-12 sm:py-14">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <p className="text-sm font-medium leading-relaxed text-jurnex-text-primary/90">
          Tu boarding pass listo en minutos. Cuando actives un plan, pagas con Mercado Pago sin vueltas.
        </p>
        <div className="flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <CrearMiEventoLink className="w-full sm:w-auto" withEmoji planeIcon>
            Crear mi viaje
          </CrearMiEventoLink>
        </div>
      </div>
    </section>
  );
}
