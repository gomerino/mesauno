import { DEMO_URL } from "@/lib/demo-invitation-public-url";
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
 * Demo protagonista: iframe con invitación completa + CTA a la misma URL (`DEMO_URL`).
 */
export function DemoPreview() {
  const urlLabel = invitationUrlLabel(DEMO_URL);

  return (
    <section
      id="demo-section"
      className="relative z-10 scroll-mt-24 border-b border-white/10 bg-[#0b1120] px-4 py-20 sm:scroll-mt-28 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]/90">Demo en vivo</p>
        <h2 className="mt-2 text-center font-display text-3xl font-bold text-white sm:text-4xl">Así se ve tu invitación</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-slate-400 sm:text-lg">
          Invitación completa: pestañas, RSVP, mapa y experiencia real para tus invitados.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm font-medium text-slate-200 sm:text-base">
          Explora una invitación real tal como la verán tus invitados
        </p>

        <div className="mt-10 flex justify-center">
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full max-w-lg items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-8 py-4 text-base font-bold tracking-wide text-[#0f172a] shadow-[0_12px_48px_rgba(212,175,55,0.3)] ring-2 ring-[#D4AF37]/45 transition hover:brightness-110 active:scale-[0.99] sm:text-lg"
          >
            Ver invitación real <span aria-hidden>✈️</span>
          </a>
        </div>

        <div className="relative z-10 mt-10 overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#0f172a] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-3 py-2.5 sm:px-5">
            <div className="mx-auto flex h-2 max-w-[200px] shrink-0 gap-1.5 sm:mx-0">
              <span className="h-2 w-2 rounded-full bg-red-400/80" />
              <span className="h-2 w-2 rounded-full bg-amber-400/80" />
              <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
            </div>
            <p className="hidden min-w-0 truncate text-[10px] font-medium text-slate-500 sm:block sm:max-w-[55%]" title={DEMO_URL}>
              {urlLabel}
            </p>
          </div>

          <div className="relative w-full bg-[#0b1120]">
            <iframe
              title="Invitación de demostración — experiencia completa"
              src={DEMO_URL}
              className="block h-[min(85dvh,900px)] min-h-[480px] w-full border-0 sm:min-h-[560px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 bg-[#0f172a] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:justify-start">
              <a
                href={DEMO_URL}
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
              href={DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full shrink-0 items-center justify-center rounded-full border-2 border-[#D4AF37]/60 bg-[#D4AF37]/10 px-5 py-2.5 text-center text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/20 active:scale-[0.99] sm:w-auto sm:min-w-[11rem]"
            >
              Ver invitación real ✈️
            </a>
          </div>
        </div>

        <p className="mx-auto mt-5 max-w-2xl text-center text-[11px] leading-relaxed text-slate-500">
          Si el recuadro no carga, puede ser un bloqueo de iframe entre dominios.{" "}
          <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] underline-offset-2 hover:underline">
            Ábrela en una pestaña nueva
          </a>
          .
        </p>
      </div>
    </section>
  );
}
