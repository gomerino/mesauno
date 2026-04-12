import Link from "next/link";

export function CTA() {
  return (
    <section className="bg-gradient-to-b from-[#0f172a] to-[#020617] px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#D4AF37]/25 bg-[#0c1222]/80 p-8 text-center shadow-[0_0_60px_rgba(212,175,55,0.08)] backdrop-blur-sm sm:p-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/90">Listos para despegar</p>
        <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">Tu invitación, nivel aerolínea</h2>
        <p className="mt-4 text-sm text-slate-400 sm:text-base">
          Crea tu boda digital con la misma elegancia que un boarding pass premium.
        </p>
        <Link
          href="/onboarding"
          className="mt-8 inline-flex min-h-[52px] min-w-[200px] items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-10 py-3 text-sm font-semibold text-[#0f172a] shadow-lg transition hover:brightness-110 active:scale-[0.98]"
        >
          Crear mi invitación
        </Link>
      </div>
    </section>
  );
}
