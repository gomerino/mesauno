import { panelCtaJurnexPrimary } from "@/components/panel/ds";
import { Card } from "@/components/jurnex-ui";
import { DEMO_URL, tieneUrlInvitacionDemo } from "@/lib/demo-invitation-public-url";

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
  const configurada = tieneUrlInvitacionDemo();
  const showcaseUrl = configurada ? withJurnexTheme(DEMO_URL) : "";
  const urlLabel = configurada ? invitationUrlLabel(showcaseUrl) : "";

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

        {configurada ? (
          <>
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

              <div className="relative flex w-full justify-center bg-jurnex-bg px-2 py-3 sm:px-4 sm:py-4">
                {/* Ancho ~móvil: el iframe reporta ~390px y la invitación aplica layout mobile-first */}
                <div className="w-full max-w-[390px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/50 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/5">
                  <div className="flex items-center justify-center border-b border-white/8 bg-white/[0.04] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Vista móvil
                  </div>
                  <iframe
                    title="Invitación Jurnex: experiencia pública de ejemplo"
                    src={showcaseUrl}
                    className="block h-[min(85dvh,900px)] min-h-[480px] w-full border-0 sm:min-h-[560px]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
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
          </>
        ) : (
          <div className="mx-auto mt-10 max-w-lg">
            <Card interactive={false} padded className="border-white/12 bg-white/[0.06] text-center text-sm leading-relaxed text-jurnex-text-primary/88">
              <p>
                En este entorno no hay un enlace de invitación de ejemplo configurado. Define{" "}
                <code className="rounded bg-black/30 px-1 py-0.5 font-mono text-[11px] text-teal-100">
                  NEXT_PUBLIC_DEMO_INVITATION_URL
                </code>{" "}
                con una URL pública de invitación para mostrar la vista previa aquí.
              </p>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}
