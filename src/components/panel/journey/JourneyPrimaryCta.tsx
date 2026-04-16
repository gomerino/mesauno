"use client";

import { JourneyUnlockCheckout } from "@/components/panel/journey/JourneyUnlockCheckout";
import Link from "next/link";

export type JourneyPrimaryCtaProps = {
  invitados_count: number;
  plan_status: string | null | undefined;
  invitaciones_enviadas: number;
  /** Misma condición que el banner de unlock en layout (trial + admin). */
  canCheckout: boolean;
  eventoId: string | null;
  userEmail: string;
  prefillNombre: string;
};

/**
 * Bloque único "Siguiente escala": título, descripción y un solo CTA (enlace o checkout).
 */
export function JourneyPrimaryCta({
  invitados_count,
  plan_status,
  invitaciones_enviadas,
  canCheckout,
  eventoId,
  userEmail,
  prefillNombre,
}: JourneyPrimaryCtaProps) {
  const paid = plan_status === "paid";
  const hasInvitaciones = invitaciones_enviadas > 0;

  let title = "Siguiente paso ✈️";
  let text = "Agrega tus pasajeros para empezar el viaje";
  let ctaLabel = "Agregar pasajeros 👥";
  let href = "/panel/invitados";
  let mode: "link" | "checkout" = "link";

  if (invitados_count > 0 && !paid) {
    title = "Desbloquea la experiencia ✨";
    text = "Todo lo que tus invitados van a vivir";
    ctaLabel = "Activar experiencia ✈️";
    if (canCheckout && eventoId) {
      mode = "checkout";
    } else {
      href = "/panel/finanzas";
    }
  } else if (paid && !hasInvitaciones) {
    title = "Siguiente paso ✈️";
    text = "Es hora de mandar tus invitaciones";
    ctaLabel = "Mandar invitaciones ✉️";
    href = "/panel/invitacion";
  } else if (paid && hasInvitaciones) {
    title = "Viaje en curso 🟢";
    text = "Tu viaje ya está activo. Revisá pasajeros y experiencia para seguir avanzando.";
    ctaLabel = "Ver experiencia ✨";
    href = "/panel/experiencia";
  }

  const ctaClasses =
    "inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-6 py-3.5 text-sm font-semibold text-[#0f172a] shadow-lg ring-1 ring-yellow-400/25 transition-all duration-200 hover:brightness-110 active:scale-[0.99] sm:w-auto sm:min-w-[200px]";

  const isCheckout = mode === "checkout" && Boolean(eventoId);

  if (isCheckout && eventoId) {
    return (
      <section
        className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-br from-[#0a0e18] via-[#0c101c] to-[#0f141d] p-4 shadow-none backdrop-blur-sm sm:p-5"
        aria-label="Siguiente escala del viaje"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]/85">Siguiente escala</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base font-semibold leading-snug text-white sm:text-lg">{title}</h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-400">{text}</p>
          </div>
          <div className="min-w-0 lg:max-w-[min(100%,22rem)] lg:flex-shrink-0 xl:max-w-[24rem]">
            <JourneyUnlockCheckout eventoId={eventoId} userEmail={userEmail} prefillNombre={prefillNombre || "Mi evento"} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#0b0f1a] via-[#0c101c] to-[#101828] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.4)] backdrop-blur-md sm:p-6"
      aria-label="Siguiente escala del viaje"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" aria-hidden />
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]/85">Siguiente escala</p>
      <h2 className="mt-1.5 font-display text-lg font-semibold leading-snug text-white sm:text-xl">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">{text}</p>

      <div className="mt-5">
        <Link href={href} className={ctaClasses}>
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
