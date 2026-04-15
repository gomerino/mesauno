export function ExperienciaHeader() {
  return (
    <header className="relative mb-8 overflow-hidden rounded-2xl border border-[#D4AF37]/15 bg-gradient-to-br from-[#D4AF37]/[0.08] via-white/[0.04] to-transparent px-5 py-6 shadow-[0_0_48px_rgba(212,175,55,0.08)] backdrop-blur-xl transition-all duration-500 sm:px-8 sm:py-8">
      <div
        className="pointer-events-none absolute -left-20 top-0 h-48 w-48 rounded-full bg-[#D4AF37]/10 blur-3xl"
        aria-hidden
      />
      <h1 className="relative font-display text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">
        ✨ Experiencia del viaje
      </h1>
      <p className="relative mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
        Todo lo que tus invitados van a vivir antes y durante el evento
      </p>
    </header>
  );
}
