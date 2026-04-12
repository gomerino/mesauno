import { DEMO_INVITATION_URL } from "@/lib/demo-invitation-public-url";
import Link from "next/link";

function invitationUrlLabel(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}`;
  } catch {
    return url;
  }
}

/**
 * Demo en landing: iframe con la invitación pública completa (misma URL que el CTA “real”).
 * Si el hosting envía X-Frame-Options/CSP restrictivo, el usuario puede abrir en pestaña nueva.
 */
export function DemoPreview() {
  const urlLabel = invitationUrlLabel(DEMO_INVITATION_URL);

  return (
    <section className="relative z-10 border-b border-white/10 bg-[#0b1120] px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-display text-2xl font-bold text-white sm:text-3xl">Vive la demo</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-400">
          Invitación completa en vivo: pestañas, RSVP, mapa y el resto tal como la verán tus invitados.
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm font-medium text-slate-300">
          Explora una invitación real tal como la verán tus invitados
        </p>

        <div className="relative z-10 mt-10 overflow-hidden rounded-xl border border-white/10 bg-[#0f172a] shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/25 px-3 py-2 sm:px-4">
            <div className="mx-auto flex h-2 max-w-[200px] shrink-0 gap-1.5 sm:mx-0">
              <span className="h-2 w-2 rounded-full bg-red-400/80" />
              <span className="h-2 w-2 rounded-full bg-amber-400/80" />
              <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
            </div>
            <p className="hidden min-w-0 truncate text-[10px] font-medium text-slate-500 sm:block sm:max-w-[50%]" title={DEMO_INVITATION_URL}>
              {urlLabel}
            </p>
          </div>

          <div className="relative w-full bg-[#0b1120]">
            <iframe
              title="Invitación de demostración — experiencia completa"
              src={DEMO_INVITATION_URL}
              className="block h-[min(88dvh,920px)] min-h-[520px] w-full border-0 sm:min-h-[600px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 bg-[#0f172a] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:justify-start">
              <a
                href={DEMO_INVITATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#D4AF37] underline-offset-2 hover:underline"
              >
                Abrir en pestaña nueva
              </a>
              <span className="hidden text-slate-600 sm:inline" aria-hidden>
                ·
              </span>
              <Link href="/invitacion/demo" className="text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline">
                Demo local (sandbox)
              </Link>
            </div>
            <a
              href={DEMO_INVITATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-5 py-2.5 text-center text-sm font-bold text-[#0f172a] shadow-md transition hover:brightness-110 active:scale-[0.99] sm:w-auto sm:min-w-[12rem]"
            >
              Ver invitación real <span aria-hidden>✈️</span>
            </a>
          </div>
        </div>

        <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] leading-relaxed text-slate-500">
          Si el recuadro sale vacío, tu navegador o el sitio pueden estar bloqueando iframes entre dominios. Usa{" "}
          <a href={DEMO_INVITATION_URL} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] underline-offset-2 hover:underline">
            abrir en pestaña nueva
          </a>
          .
        </p>
      </div>
    </section>
  );
}
