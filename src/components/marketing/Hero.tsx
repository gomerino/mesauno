import Image from "next/image";
import { CrearMiEventoLink } from "@/components/marketing/CrearMiEventoLink";
import { VerPlanesCtaLink } from "@/components/marketing/VerPlanesCtaLink";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#0c1222] via-[#0f172a] to-[#0b1120] px-4 pb-16 pt-12 sm:pb-24 sm:pt-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-center lg:gap-14">
        <div className="min-w-0 flex-1 text-center lg:text-left">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]/90">
            Dreams · invitaciones estilo boarding pass
          </p>
          <h1 className="font-display text-[clamp(1.85rem,5vw,3.25rem)] font-bold leading-[1.12] tracking-tight text-white">
            Celebra tu evento como nunca antes <span aria-hidden>✨</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-300 lg:mx-0 lg:text-lg">
            Invita, organiza y comparte cada momento con tus invitados en un solo lugar.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            <CrearMiEventoLink className="w-full sm:w-auto" />
            <VerPlanesCtaLink className="w-full sm:w-auto" />
            <a
              href="#demo-section"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-white/15 bg-transparent px-8 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5 active:scale-[0.98] sm:w-auto"
            >
              Ver sección demo
            </a>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[20rem] shrink-0 lg:mx-0">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm border border-white/15 bg-[#1e293b]/40 shadow-[0_24px_80px_rgba(0,0,0,0.45)] ring-1 ring-[#D4AF37]/25">
            <Image
              src="/dreams-airlines-logo.png"
              alt="Estética premium tipo pase de abordaje"
              fill
              className="object-contain object-center p-6 sm:p-8"
              sizes="(max-width: 1024px) 100vw, 320px"
              priority
            />
          </div>
          <p className="mt-3 text-center text-[11px] text-slate-500 lg:text-left">Bodas, cumpleaños, corporativos y más</p>
        </div>
      </div>
    </section>
  );
}
