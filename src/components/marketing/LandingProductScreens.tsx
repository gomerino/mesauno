import Image from "next/image";

type PreviewItem = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  src: string;
  alt: string;
  frame: "browser" | "phone";
};

const previews: PreviewItem[] = [
  {
    id: "panel-dashboard",
    eyebrow: "Panel de control",
    title: "Contexto sin ruido",
    body: "Nombre del evento, cuenta regresiva y siguientes escalas claras antes de entrar en detalle.",
    src: "/marketing/landing/panel-dashboard.png",
    alt: "Vista del panel de control Jurnex: resumen del matrimonio y módulos viaje y pasajeros",
    frame: "browser",
  },
  {
    id: "panel-pasajeros",
    eyebrow: "Pasajeros",
    title: "Lista y envío en la misma pantalla",
    body: "Cómo contactas por correo o WhatsApp, envío masivo y seguimiento de respuestas, sin pestañas de más.",
    src: "/marketing/landing/panel-pasajeros.png",
    alt: "Vista de gestión de pasajeros: envío de invitaciones y lista de invitados",
    frame: "browser",
  },
  {
    id: "invitacion-pase",
    eyebrow: "Invitación personal",
    title: "Lo que cada invitado lleva en el móvil",
    body: "Pase tipo boarding pass, RSVP, mapa y detalles del día en un formato listo para compartir.",
    src: "/marketing/landing/invitacion-pase.png",
    alt: "Invitación digital en formato pase de abordaje con confirmación de asistencia",
    frame: "phone",
  },
];

function WindowDots() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      <span className="h-2 w-2 rounded-full bg-[#ff5f57]/95" />
      <span className="h-2 w-2 rounded-full bg-[#febc2e]/95" />
      <span className="h-2 w-2 rounded-full bg-[#28c840]/95" />
    </div>
  );
}

export function LandingProductScreens() {
  return (
    <section
      id="producto-real"
      className="relative scroll-mt-24 border-b border-jurnex-border bg-gradient-to-b from-jurnex-bg via-[#040c16] to-jurnex-bg px-4 py-16 sm:scroll-mt-28 sm:py-24"
      aria-labelledby="producto-real-title"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_80%_70%_at_50%_0%,rgba(232,154,30,0.06),transparent_65%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-100/95">Capturas del producto</p>
        <h2 id="producto-real-title" className="mt-2 text-center font-display text-2xl font-bold text-jurnex-text-primary sm:text-3xl md:text-4xl">
          Así se siente usar Jurnex
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-jurnex-text-primary/86 sm:text-lg">
          Tres vistas conectadas: tu tablero, la gestión de invitados y la invitación que recibe cada persona.
        </p>

        <ul className="mt-12 grid list-none gap-10 lg:grid-cols-3 lg:gap-8 xl:gap-10">
          {previews.map((item) => {
            return (
              <li key={item.id} className="min-w-0">
                <figure className="flex h-full flex-col">
                  <div className={`${item.frame === "phone" ? "flex justify-center" : ""}`}>
                    <div className={item.frame === "phone" ? "w-full max-w-[min(272px,90vw)]" : "w-full"}>
                      <div
                        className={`overflow-hidden rounded-2xl border border-white/[0.12] bg-[#050f1a] shadow-[0_24px_80px_-28px_rgba(0,0,0,0.75)] ring-1 ring-jurnex-secondary/15 ${
                          item.frame === "phone" ? "rounded-[1.85rem]" : ""
                        }`}
                      >
                        <div
                          className={`flex items-center gap-3 border-b border-white/[0.08] bg-black/45 px-3 py-2.5 sm:px-4 ${
                            item.frame === "phone" ? "rounded-t-[1.85rem]" : ""
                          }`}
                        >
                          <WindowDots />
                          <span className="min-w-0 flex-1 truncate text-center text-[10px] font-medium tracking-wide text-white/45 sm:text-[11px]">
                            {item.frame === "phone" ? "Vista invitado · móvil" : "Panel Jurnex"}
                          </span>
                          <span className="w-10 shrink-0 sm:w-14" aria-hidden />
                        </div>

                        <div
                          className={`relative bg-[#030a12] ${
                            item.frame === "browser"
                              ? "aspect-[16/10] w-full md:aspect-[16/10]"
                              : "aspect-[10/17] w-full"
                          }`}
                        >
                          <Image
                            src={item.src}
                            alt={item.alt}
                            fill
                            sizes={
                              item.frame === "browser"
                                ? "(min-width: 1280px) 400px, (min-width: 1024px) 33vw, 100vw"
                                : "(max-width: 1023px) 90vw, 272px"
                            }
                            className="object-cover object-top"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <figcaption className="mt-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-jurnex-secondary/95">{item.eyebrow}</p>
                    <h3 className="mt-1.5 font-display text-lg font-semibold text-jurnex-text-primary sm:text-xl">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-jurnex-text-primary/82 sm:text-[15px]">{item.body}</p>
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
