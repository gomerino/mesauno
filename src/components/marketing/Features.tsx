import { BoardingPass } from "@/components/invitacion/BoardingPass";
import { landingBoardingPassDemo } from "@/components/marketing/boarding-pass-demo";
import { CreditCard, MapPin, Plane, type LucideIcon } from "lucide-react";

type IconBlock = {
  title: string;
  body: string;
  Icon: LucideIcon;
  showBoardingMockup?: false;
};

type BoardingBlock = {
  title: string;
  body: string;
  Icon: LucideIcon;
  showBoardingMockup: true;
};

const blocks: readonly (IconBlock | BoardingBlock)[] = [
  {
    title: "Panel: tu vuelo en un solo lugar",
    body: "Journey con check-in, despegue y en vuelo. Invitados, confirmaciones, envíos, programa, recuerdos, regalos y experiencia, sin cadenas de mensajes sueltos.",
    Icon: MapPin,
  },
  {
    title: "Invitación pase de abordaje",
    body: "Link claro para cada invitado, estética aérea y RSVP, mapa y detalles del evento, listo para abrir en el móvil en el instante de la fiesta.",
    Icon: Plane,
  },
  {
    title: "Boarding pass real y validado",
    body: "Misma pieza que ve tu invitado: cabecera navy, ruta, datos de embarque y QR para llegar sin fricción.",
    Icon: Plane,
    showBoardingMockup: true,
  },
  {
    title: "Pago con Mercado Pago",
    body: "Activa el plan de tu boda (Esencial o Experiencia) con pago claro, sin sorpresas, alineado con el panel y tu viaje.",
    Icon: CreditCard,
  },
] as const;

export function Features() {
  return (
    <section className="border-b border-jurnex-border bg-jurnex-bg/95 px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-display text-2xl font-bold text-jurnex-text-primary sm:text-3xl">Lo que ya hace Jurnex por tu viaje</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm font-medium leading-relaxed text-jurnex-text-primary/88 sm:text-base">
          Nada de humo: estas piezas están operativas, listas para que crees el evento y acompañes a tu tripulación.
        </p>
        <ul className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {blocks.map((block) => {
            const { title, body, Icon } = block;
            const cardSurface =
              "flex h-full min-h-0 flex-col rounded-2xl border border-white/[0.12] bg-white/[0.07] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition duration-200 hover:border-teal-500/35 hover:shadow-jurnex-glow sm:p-6";

            if (block.showBoardingMockup) {
              return (
                <li key={title} className={cardSurface}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-teal-500/25 to-jurnex-secondary/15 text-teal-100 ring-1 ring-teal-400/25">
                    <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold text-jurnex-text-primary sm:text-lg">{title}</h3>
                  <div className="mt-3 min-h-0 flex-1">
                    <BoardingPass variant="jurnex" {...landingBoardingPassDemo} />
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-jurnex-text-primary/82 sm:text-[15px]">{body}</p>
                </li>
              );
            }

            return (
              <li key={title} className={cardSurface}>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-teal-500/25 to-jurnex-secondary/15 text-teal-100 ring-1 ring-teal-400/25">
                  <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-jurnex-text-primary sm:text-lg">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-jurnex-text-primary/82 sm:text-[15px]">{body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
