import { DEMO_URL } from "@/lib/demo-invitation-public-url";

function invitationUrlLabel(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}`;
  } catch {
    return url;
  }
}

/**
 * Vista pública de la invitación (producto real embebido). Sin lenguaje de "demo": es la experiencia al construir tu viaje.
 */
export function InvitacionShowcase() {
  const urlLabel = invitationUrlLabel(DEMO_URL);

  return (
    <section
      id="invitacion-jurnex"
      className="relative z-10 scroll-mt-24 border-b border-jurnex-border bg-jurnex-bg/95 px-4 py-20 sm:scroll-mt-28 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-jurnex-secondary/90">
          Invitación
        </p>
        <h2 className="mt-2 text-center font-display text-3xl font-bold text-jurnex-text-primary sm:text-4xl">
          El tablero de bordo que viven tus invitados
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-jurnex-text-secondary sm:text-lg">
          Misma lógica que cuidas en Jurnex: pase, RSVP, mapa, programa y el tono cálido del gran día, listo en web.
        </p>

        <div className="mt-10 flex justify-center">
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full max-w-lg items-center justify-center rounded-full bg-gradient-to-r from-jurnex-primary to-[#b87a0f] px-8 py-4 text-base font-bold tracking-wide text-[#0f172a] shadow-[0_12px_48px_rgba(232,154,30,0.2)] ring-1 ring-jurnex-primary/30 transition hover:brightness-110 active:scale-[0.99] sm:text-lg"
          >
            Abrir en pestaña nueva <span className="ml-2" aria-hidden>✈️</span>
          </a>
        </div>

        <div className="relative z-10 mt-10 overflow-hidden rounded-jurnex-md border border-jurnex-border bg-jurnex-surface/30 shadow-jurnex-card">
          <div className="flex items-center justify-between gap-3 border-b border-jurnex-border bg-black/20 px-3 py-2.5 sm:px-5">
            <div className="mx-auto flex h-2 max-w-[200px] shrink-0 gap-1.5 sm:mx-0">
              <span className="h-2 w-2 rounded-full bg-red-400/80" />
              <span className="h-2 w-2 rounded-full bg-amber-400/80" />
              <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
            </div>
            <p
              className="hidden min-w-0 truncate text-[10px] font-medium text-jurnex-text-muted sm:block sm:max-w-[55%]"
              title={DEMO_URL}
            >
              {urlLabel}
            </p>
          </div>

          <div className="relative w-full bg-jurnex-bg">
            <iframe
              title="Invitación Jurnex: experiencia pública de ejemplo"
              src={DEMO_URL}
              className="block h-[min(85dvh,900px)] min-h-[480px] w-full border-0 sm:min-h-[560px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="flex items-center justify-center border-t border-jurnex-border bg-jurnex-surface/40 px-4 py-4 sm:px-6">
            <a
              href={DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-jurnex-primary underline-offset-2 hover:underline"
            >
              No carga en el móvil o hay bloqueo de iframe: abrila en otra ventana
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
