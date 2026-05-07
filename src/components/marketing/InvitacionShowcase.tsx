import { panelCtaJurnexPrimary } from "@/components/panel/ds";
import { DEMO_URL } from "@/lib/demo-invitation-public-url";

function invitationUrlLabel(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}`;
  } catch {
    return url;
  }
}

function withJurnexTheme(url: string): string {
  try {
    const u = new URL(url);
    if (!u.searchParams.get("theme")) {
      u.searchParams.set("theme", "jurnex");
    }
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Vista pública de la invitación (producto real embebido). Sin lenguaje de "demo": es la experiencia al construir tu viaje.
 */
export function InvitacionShowcase() {
  const showcaseUrl = withJurnexTheme(DEMO_URL);
  const urlLabel = invitationUrlLabel(showcaseUrl);

  return (
    <section
      id="invitacion-jurnex"
      className="relative z-10 scroll-mt-24 border-b border-jurnex-border bg-jurnex-bg/95 px-4 py-20 sm:scroll-mt-28 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-100">
          Boarding pass real
        </p>
        <h2 className="mt-2 text-center font-display text-3xl font-bold text-jurnex-text-primary sm:text-4xl">
          Así se ve la invitación real que reciben tus invitados
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-jurnex-text-primary/88 sm:text-lg">
          Misma lógica que cuidas en Jurnex: pase, RSVP, mapa, programa y el tono cálido del gran día, listo en web.
        </p>

        <div className="mt-10 flex justify-center">
          <a
            href={showcaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={
              panelCtaJurnexPrimary + " jurnex-cta-pulse w-full max-w-lg min-h-[52px] justify-center px-8 py-4 text-base font-bold tracking-wide sm:text-lg"
            }
          >
            Ver invitación real <span className="jurnex-cta-emoji ml-2 inline-block" aria-hidden>✈️</span>
          </a>
        </div>

        <div className="relative z-10 mt-10 overflow-hidden rounded-jurnex-md border border-jurnex-secondary/35 bg-[#041525] shadow-jurnex-card ring-1 ring-jurnex-secondary/25">
          <div className="flex items-center justify-between gap-3 border-b border-jurnex-secondary/25 bg-[#03111f] px-3 py-2.5 sm:px-5">
            <div className="mx-auto flex h-2 max-w-[200px] shrink-0 gap-1.5 sm:mx-0">
              <span className="h-2 w-2 rounded-full bg-jurnex-secondary/85" />
              <span className="h-2 w-2 rounded-full bg-jurnex-primary/85" />
              <span className="h-2 w-2 rounded-full bg-teal-400/85" />
            </div>
            <p
              className="hidden min-w-0 truncate text-[10px] font-medium text-white/78 sm:block sm:max-w-[55%]"
              title={showcaseUrl}
            >
              {urlLabel}
            </p>
          </div>

          <div className="relative w-full bg-jurnex-bg">
            <iframe
              title="Invitación Jurnex: experiencia pública de ejemplo"
              src={showcaseUrl}
              className="block h-[min(85dvh,900px)] min-h-[480px] w-full border-0 sm:min-h-[560px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="flex items-center justify-center border-t border-jurnex-secondary/25 bg-[#03111f] px-4 py-4 sm:px-6">
            <a
              href={showcaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-teal-100 underline-offset-2 hover:text-white hover:underline"
            >
              Si tu navegador bloquea el iframe, ábrela en otra ventana
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
