"use client";

import Link from "next/link";

type Props = {
  invitadosCount: number;
  isPaid: boolean;
  emailsEnviados: number;
};

export function NextStepCard({ invitadosCount, isPaid, emailsEnviados }: Props) {
  const hasInvitados = invitadosCount > 0;
  const hasInvitaciones = emailsEnviados > 0;

  let title = "Siguiente paso ✈️";
  let text = "Agrega tus pasajeros para empezar el viaje";
  let cta = "Agregar pasajeros 👥";
  let href = "/panel/invitados";

  if (hasInvitados && !isPaid) {
    title = "Siguiente paso ✈️";
    text = "Activa tu viaje para desbloquear la experiencia";
    cta = "Activar tu viaje ✈️";
    href = "#unlock-banner";
  } else if (isPaid && !hasInvitaciones) {
    title = "Siguiente paso ✈️";
    text = "Es hora de mandar tus invitaciones";
    cta = "Mandar invitaciones ✉️";
    href = "/panel/invitacion";
  } else if (isPaid && hasInvitaciones) {
    title = "Viaje en curso 🟢";
    text = "Tu viaje ya está activo. Revisa pasajeros y experiencia para seguir avanzando.";
    cta = "Ver experiencia ✨";
    href = "/panel/experiencia";
  }

  return (
    <section
      className="rounded-3xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#D4AF37]/[0.13] via-white/[0.06] to-white/[0.03] p-6 shadow-[0_20px_56px_rgba(212,175,55,0.12)] backdrop-blur-xl transition-all duration-300 sm:p-7"
      aria-label="Siguiente paso del viaje"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#D4AF37]/90">Siguiente paso</p>
      <h2 className="mt-2 font-display text-xl font-semibold text-white sm:text-2xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">{text}</p>

      <Link
        href={href}
        className="mt-5 inline-flex min-h-[46px] items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-6 text-sm font-semibold text-[#0f172a] shadow-lg transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
      >
        {cta}
      </Link>
    </section>
  );
}
