const steps = [
  { n: "1", title: "Crea tu evento", body: "Nombre, fecha y estilo boarding pass en minutos — sin complicaciones." },
  { n: "2", title: "Agrega invitados", body: "Lista, mesas, RSVP y recordatorios desde un solo panel." },
  { n: "3", title: "Comparte el link", body: "Cada invitado recibe su pase único listo para el gran día." },
] as const;

export function HowItWorks() {
  return (
    <section className="border-b border-white/10 bg-[#0f172a] px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-display text-2xl font-bold text-white sm:text-3xl">Cómo funciona</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-slate-400">Tres pasos. Un solo lugar.</p>
        <ol className="mx-auto mt-14 grid max-w-4xl gap-10 sm:grid-cols-3 sm:gap-8">
          {steps.map((s, i) => (
            <li key={s.n} className="relative text-center sm:text-left">
              {i < steps.length - 1 ? (
                <div
                  className="absolute left-[calc(50%-1px)] top-10 hidden h-px w-full bg-gradient-to-r from-[#D4AF37]/50 to-transparent sm:left-full sm:top-5 sm:block sm:w-[calc(100%-2rem)]"
                  aria-hidden
                />
              ) : null}
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 font-display text-sm font-bold text-[#D4AF37] sm:mx-0">
                {s.n}
              </span>
              <h3 className="mt-4 font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
