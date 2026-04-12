import { LayoutDashboard, Send, Sparkles } from "lucide-react";

const blocks = [
  {
    title: "Invita a todos en segundos",
    body: "Envía tu invitación por WhatsApp o correo con un solo clic.",
    Icon: Send,
  },
  {
    title: "Vive tu evento junto a tus invitados",
    body: "Fotos en tiempo real, playlist colaborativa y programa siempre actualizado.",
    Icon: Sparkles,
  },
  {
    title: "Todo bajo control",
    body: "Gestiona invitados, mesas y check-in desde un solo lugar.",
    Icon: LayoutDashboard,
  },
] as const;

export function Features() {
  return (
    <section className="border-b border-white/10 bg-[#0f172a] px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-display text-2xl font-bold text-white sm:text-3xl">Valor que se nota al instante</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-slate-400 sm:text-base">
          Pensado para cualquier celebración que merezca una experiencia impecable, sin perseguir hojas ni grupos de WhatsApp perdidos.
        </p>
        <ul className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-3 sm:gap-8">
          {blocks.map(({ title, body, Icon }) => (
            <li
              key={title}
              className="flex flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 shadow-lg transition duration-300 hover:border-[#D4AF37]/35 hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)] sm:p-8"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]/12 text-[#D4AF37] ring-1 ring-[#D4AF37]/30">
                <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-white sm:text-xl">{title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400 sm:text-[15px]">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
