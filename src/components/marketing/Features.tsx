import { CreditCard, MapPin, Plane, Users2 } from "lucide-react";

const blocks = [
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
    title: "Descubre proveedores",
    body: "Listado con filtros, favoritos y un camino claro a contacto cuando tú elijas, sin llenar la pantalla de jerga: solo tú, tu evento y buenas fichas.",
    Icon: Users2,
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
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-jurnex-text-secondary sm:text-base">
          Nada de humo: estas piezas están operativas, listas para que crees el evento y acompañes a tu tripulación.
        </p>
        <ul className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {blocks.map(({ title, body, Icon }) => (
            <li
              key={title}
              className="flex h-full min-h-0 flex-col rounded-2xl border border-jurnex-border bg-jurnex-surface/50 p-6 transition duration-200 hover:border-teal-500/30 hover:shadow-jurnex-glow sm:p-6"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-gradient-to-br from-teal-500/20 to-jurnex-secondary/10 text-teal-200 ring-1 ring-teal-500/20">
                <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-jurnex-text-primary sm:text-lg">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-jurnex-text-secondary sm:text-[15px]">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
