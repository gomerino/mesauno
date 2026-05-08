import { Card } from "@/components/jurnex-ui";
import { CalendarDays, LayoutDashboard, Music, Plane } from "lucide-react";

const cardDemo =
  "flex min-h-[220px] min-w-[min(85vw,260px)] shrink-0 snap-start flex-col rounded-2xl border border-white/[0.12] bg-white/[0.07] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] sm:min-h-[200px] sm:min-w-[240px] lg:min-w-[220px]";

/** Carrusel horizontal en móvil con vistas del producto. */
export function LandingDemoFlujo() {
  const items = [
    {
      title: "Dashboard",
      body: "Tu viaje, invitados y pendientes en un solo tablero.",
      Icon: LayoutDashboard,
    },
    {
      title: "Invitación",
      body: "Pase de abordaje, confirmación de asistencia (RSVP) y mapa como lo ve tu invitado.",
      Icon: Plane,
    },
    {
      title: "Programa",
      body: "Ceremonia, fiesta y momentos con orden y claridad.",
      Icon: CalendarDays,
    },
    {
      title: "Música",
      body: "Playlist y experiencia para cuando suene la fiesta.",
      Icon: Music,
    },
  ] as const;

  return (
    <section
      id="demo-flujo"
      className="border-b border-jurnex-border bg-jurnex-bg/95 px-4 py-16 sm:py-24"
      aria-labelledby="demo-flujo-title"
    >
      <div className="mx-auto max-w-6xl">
        <h2 id="demo-flujo-title" className="text-center font-display text-2xl font-bold text-jurnex-text-primary sm:text-3xl">
          Todo lo que armas, en un solo flujo
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm font-medium text-jurnex-text-primary/88 sm:text-base">
          Cuatro piezas conectadas: mismos datos, menos idas y vueltas.
        </p>

        <div className="relative mt-10">
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-5 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
            {items.map(({ title, body, Icon }) => (
              <Card key={title} interactive={false} padded={false} className={cardDemo}>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-teal-500/25 to-jurnex-secondary/15 text-teal-100 ring-1 ring-teal-400/25">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-jurnex-text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-jurnex-text-primary/82">{body}</p>
              </Card>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-jurnex-text-muted sm:hidden">Desliza para ver las cuatro vistas</p>
        </div>
      </div>
    </section>
  );
}

export function LandingDiferencial() {
  const blocks = [
    {
      title: "Boarding pass",
      body: "La misma tarjeta premium que el invitado tiene en el móvil.",
      Icon: Plane,
    },
    {
      title: "Playlist colaborativa",
      body: "Pides temas y eliges qué suena sin salir del viaje.",
      Icon: Music,
    },
    {
      title: "Programa en vivo",
      body: "Ceremonia y fiesta ordenadas para que nadie se pierda el momento.",
      Icon: CalendarDays,
    },
  ] as const;

  return (
    <section className="border-b border-jurnex-border bg-jurnex-bg px-4 py-16 sm:py-24" aria-labelledby="diferencial-title">
      <div className="mx-auto max-w-6xl">
        <h2 id="diferencial-title" className="text-center font-display text-2xl font-bold text-jurnex-text-primary sm:text-3xl">
          No es una invitación. Es la experiencia completa.
        </h2>
        <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-3 sm:gap-5">
          {blocks.map(({ title, body, Icon }) => (
            <li
              key={title}
              className="flex flex-col rounded-2xl border border-white/[0.12] bg-white/[0.07] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition duration-200 hover:border-teal-500/35 hover:shadow-jurnex-glow"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-teal-500/25 to-jurnex-secondary/15 text-teal-100 ring-1 ring-teal-400/25">
                <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-jurnex-text-primary sm:text-lg">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-jurnex-text-primary/82 sm:text-[15px]">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function LandingAntesConJurnex() {
  return (
    <section className="border-b border-white/[0.08] bg-white/[0.04] px-4 py-16 sm:py-24">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 md:gap-8">
        <Card interactive={false} padded className="border-white/10 bg-jurnex-bg/80 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-jurnex-text-muted">Antes</p>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-jurnex-text-primary/88">
            <li className="flex gap-2">
              <span className="text-jurnex-text-muted">·</span> Excel que nadie actualiza
            </li>
            <li className="flex gap-2">
              <span className="text-jurnex-text-muted">·</span> WhatsApp sin fin
            </li>
            <li className="flex gap-2">
              <span className="text-jurnex-text-muted">·</span> Planos y confirmaciones desordenadas
            </li>
          </ul>
        </Card>
        <Card interactive={false} padded className="border-teal-500/25 bg-jurnex-bg/90 text-left ring-1 ring-teal-500/15">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-100">Con Jurnex</p>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-jurnex-text-primary/92">
            <li className="flex gap-2">
              <span className="text-teal-300">✓</span> Todo en un solo lugar
            </li>
            <li className="flex gap-2">
              <span className="text-teal-300">✓</span> Confirmaciones claras por invitado
            </li>
            <li className="flex gap-2">
              <span className="text-teal-300">✓</span> Invitación, programa y música integrados
            </li>
          </ul>
        </Card>
      </div>
    </section>
  );
}
