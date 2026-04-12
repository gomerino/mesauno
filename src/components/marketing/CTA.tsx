import { CrearMiEventoLink } from "@/components/marketing/CrearMiEventoLink";

export function CTA() {
  return (
    <section className="bg-gradient-to-b from-[#0f172a] to-[#020617] px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#D4AF37]/25 bg-[#0c1222]/80 p-10 text-center shadow-[0_0_60px_rgba(212,175,55,0.08)] backdrop-blur-sm sm:p-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/90">Tu próximo evento</p>
        <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">Lleva la experiencia al nivel aerolínea</h2>
        <p className="mt-5 text-sm leading-relaxed text-slate-400 sm:text-base">
          Invitación digital premium, organización clara y check-in sin colas. Ideal para bodas, cumpleaños, lanzamientos y celebraciones que merecen brillar.
        </p>
        <div className="mt-10 flex justify-center">
          <CrearMiEventoLink className="w-full max-w-sm sm:w-auto sm:px-12" />
        </div>
      </div>
    </section>
  );
}
