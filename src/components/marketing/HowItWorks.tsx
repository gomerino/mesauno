const steps = [
  {
    n: "1",
    title: "Crea tu viaje",
    body: "Onboarding con nombre, fecha y estilo: levantas el evento y entras al panel con el recorrido claro (check-in, en vuelo, aterrizaje).",
  },
  {
    n: "2",
    title: "Reúne a la tripulación",
    body: "Invitados, confirmaciones, mesas, regalos, recuerdos y el programa: todo en Jurnex, sin cadenas de chat fragmentadas.",
  },
  {
    n: "3",
    title: "Comparte el pase y suma rumbo",
    body: "Cada invitado con su enlace. Cuando quieras, el marketplace y los proveedores cerca, al ritmo de tu boda.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="border-b border-jurnex-border bg-jurnex-bg/90 px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-display text-2xl font-bold text-jurnex-text-primary sm:text-3xl">Cómo se arma el vuelo</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-jurnex-text-secondary">Tres etapas. Un solo tablero.</p>
        <ol className="mx-auto mt-14 grid max-w-4xl gap-10 sm:grid-cols-3 sm:gap-8">
          {steps.map((s, i) => (
            <li key={s.n} className="relative text-center sm:text-left">
              {i < steps.length - 1 ? (
                <div
                  className="absolute left-[calc(50%-1px)] top-10 hidden h-px w-full bg-gradient-to-r from-jurnex-primary/50 to-transparent sm:left-full sm:top-5 sm:block sm:w-[calc(100%-2rem)]"
                  aria-hidden
                />
              ) : null}
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-jurnex-primary/40 bg-jurnex-primary/10 font-display text-sm font-bold text-jurnex-primary sm:mx-0">
                {s.n}
              </span>
              <h3 className="mt-4 font-semibold text-jurnex-text-primary">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-jurnex-text-secondary">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
