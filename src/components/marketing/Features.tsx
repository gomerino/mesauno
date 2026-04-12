import { Images, QrCode, Table2, Users } from "lucide-react";

const items = [
  {
    title: "Confirma asistencia en segundos",
    body: "RSVP claro para ti y para tus invitados, sin hojas sueltas.",
    Icon: Users,
  },
  {
    title: "Asigna mesas fácilmente",
    body: "Destino en el pase alineado con tu plan de sala y staff.",
    Icon: Table2,
  },
  {
    title: "Comparte música y fotos",
    body: "Playlist colaborativa y bitácora cuando quieras activarlas.",
    Icon: Images,
  },
  {
    title: "Check-in con QR el día del evento",
    body: "Ingreso fluido y registro en tiempo real para tu equipo.",
    Icon: QrCode,
  },
] as const;

export function Features() {
  return (
    <section className="border-b border-white/10 bg-[#0f172a] px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-display text-2xl font-bold text-white sm:text-3xl">Todo lo que necesitas a bordo</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-400">
          Herramientas pensadas para novios que quieren una experiencia memorable, sin fricción.
        </p>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:gap-6">
          {items.map(({ title, body, Icon }) => (
            <li
              key={title}
              className="group flex gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#D4AF37]/35 hover:bg-white/[0.05]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] ring-1 ring-[#D4AF37]/25">
                <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
