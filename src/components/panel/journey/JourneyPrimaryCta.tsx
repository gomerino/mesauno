"use client";

import { JourneyUnlockCheckout } from "@/components/panel/journey/JourneyUnlockCheckout";
import type { JourneyPhaseId } from "@/lib/journey-phases";
import Link from "next/link";

export type JourneyPrimaryCtaProps = {
  invitados_count: number;
  plan_status: string | null | undefined;
  payment_status?: "approved" | "rejected" | "pending" | null;
  invitaciones_enviadas: number;
  /** Misma condición que el banner de unlock en layout (trial + admin). */
  canCheckout: boolean;
  eventoId: string | null;
  userEmail: string;
  prefillNombre: string;
  /** Etapa del viaje (fecha del evento); no altera prioridad de pago/plan. */
  phase?: JourneyPhaseId;
};

function isPlanActive(status: string | null | undefined): boolean {
  return status === "paid";
}

/**
 * Bloque único "Siguiente escala": título, descripción y un solo CTA (enlace o checkout).
 */
export function JourneyPrimaryCta({
  invitados_count,
  plan_status,
  payment_status,
  invitaciones_enviadas,
  canCheckout,
  eventoId,
  userEmail,
  prefillNombre,
  phase = "check-in",
}: JourneyPrimaryCtaProps) {
  const isActive = isPlanActive(plan_status);
  const paymentStatus = payment_status ?? null;

  if (process.env.NODE_ENV === "development") {
    console.log({ plan_status, paymentStatus });
  }

  const hasInvitaciones = invitaciones_enviadas > 0;

  let title = "Siguiente paso ✈️";
  let text = "Agrega tus pasajeros para empezar el viaje";
  let ctaLabel = "Agregar pasajeros 👥";
  let href = "/panel/invitados";
  let mode: "link" | "checkout" = "link";

  // Prioridad de render explícita:
  // 1) plan activo, 2) pending, 3) rejected, 4) invitados + checkout, 5) etapa + invitados 0.
  if (isActive) {
    title = "✨ Experiencia activada";
    if (phase === "check-in") {
      ctaLabel = "Invitar pasajeros";
      href = "/panel/invitacion";
      text = hasInvitaciones
        ? "Compartí el acceso y seguí sumando quienes vuelan contigo."
        : "Tu plan está activo: invitá y completá los detalles cuando quieras.";
    } else if (phase === "despegue") {
      ctaLabel = "Ver programa";
      href = "/panel/programa";
      text = "Coordiná últimos detalles y tené el día a mano, sin apuro.";
    } else {
      ctaLabel = "Ver experiencia";
      href = "/panel/experiencia";
      text = "Mostrá lo que armaste y compartí el momento con quienes vuelan contigo.";
    }
  } else if (paymentStatus === "pending") {
    title = "Pago en revisión";
    text = "Estamos esperando confirmación. Actualiza el estado en unos segundos.";
    ctaLabel = "Actualizar estado";
    href = "/panel?welcome=1";
  } else if (paymentStatus === "rejected") {
    title = "Pago no aprobado";
    text = "No se pudo activar el plan. Puedes intentarlo nuevamente cuando quieras.";
    ctaLabel = "Intentar nuevamente";
    href = "/panel/finanzas";
  } else if (invitados_count > 0) {
    title = "Desbloquea la experiencia ✨";
    text =
      phase === "despegue"
        ? "Activá el viaje y coordiná el programa con tus pasajeros."
        : phase === "en-vuelo"
          ? "Activá para que tus invitados disfruten la experiencia completa."
          : "Todo lo que tus invitados van a vivir";
    ctaLabel = "Activar experiencia ✈️";
    if (canCheckout && eventoId) {
      mode = "checkout";
    } else {
      href = "/panel/finanzas";
    }
  } else if (phase === "check-in") {
    title = "Tu viaje comienza pronto ✈️";
    text = "Completá la información clave e invitá cuando te sientas listo.";
    ctaLabel = "Completar datos";
    href = "/panel/evento";
  } else if (phase === "despegue") {
    title = "Todo listo para el gran día";
    text = "Revisá el programa y coordiná con tus pasajeros sin perder el ritmo.";
    ctaLabel = "Ver programa";
    href = "/panel/programa";
  } else {
    title = "Disfruta la experiencia";
    text = "Explorá lo que preparaste y compartilo con quien vuela contigo.";
    ctaLabel = "Ver experiencia";
    href = "/panel/experiencia";
  }

  const ctaClasses =
    "inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-6 py-3.5 text-sm font-semibold text-[#0f172a] shadow-lg ring-1 ring-yellow-400/25 transition-all duration-200 hover:brightness-110 active:scale-[0.99] sm:w-auto sm:min-w-[200px]";

  const isCheckout = mode === "checkout" && Boolean(eventoId);

  if (isCheckout && eventoId) {
    return (
      <section
        className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-br from-[#0a0e18] via-[#0c101c] to-[#0f141d] p-4 shadow-none backdrop-blur-sm md:p-4"
        aria-label="Siguiente escala del viaje"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]/85">Siguiente escala</p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
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
      className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#0b0f1a] via-[#0c101c] to-[#101828] p-4 shadow-[0_20px_48px_rgba(0,0,0,0.4)] backdrop-blur-md md:p-4"
      aria-label="Siguiente escala del viaje"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" aria-hidden />
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]/85">Siguiente escala</p>
      <h2 className="mt-1.5 font-display text-lg font-semibold leading-snug text-white sm:text-xl">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">{text}</p>

      <div className="mt-4">
        <Link href={href} className={ctaClasses}>
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
