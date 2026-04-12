import Image from "next/image";
import Link from "next/link";

/** Vista previa sin iframe: evita conflictos de enrutamiento/caché y carga la home de forma fiable. */
export function DemoPreview() {
  return (
    <section className="border-b border-white/10 bg-[#0b1120] px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-display text-2xl font-bold text-white sm:text-3xl">Vive la demo</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-400">
          Explora una invitación interactiva con boarding pass, sin crear cuenta.
        </p>
        <div className="mt-10 overflow-hidden rounded-xl border border-white/10 bg-[#0f172a] shadow-2xl shadow-black/40">
          <div className="border-b border-white/10 bg-black/20 px-4 py-2">
            <div className="mx-auto flex h-2 max-w-[200px] gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400/80" />
              <span className="h-2 w-2 rounded-full bg-amber-400/80" />
              <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
            </div>
          </div>
          <div className="relative flex min-h-[220px] flex-col items-center justify-center gap-6 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#0b1120] px-6 py-12 sm:min-h-[280px] sm:flex-row sm:py-10">
            <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
              <Image
                src="/dreams-airlines-logo.png"
                alt="Dreams Airlines"
                fill
                className="object-contain opacity-95"
                sizes="128px"
              />
            </div>
            <div className="max-w-md text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">Preview</p>
              <p className="mt-2 font-display text-lg font-semibold text-white sm:text-xl">Pase de abordaje interactivo</p>
              <p className="mt-2 text-sm text-slate-400">RSVP, mapa, itinerario y más — abre la demo con un clic.</p>
              <Link
                href="/invitacion/demo"
                className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-6 py-2.5 text-sm font-semibold text-[#0f172a] transition hover:brightness-110 active:scale-[0.98]"
              >
                Abrir demo en vivo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
