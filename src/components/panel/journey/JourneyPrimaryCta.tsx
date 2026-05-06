"use client";

import { panelCtaJurnexJourneyPillLayout, panelCtaJurnexPrimary } from "@/components/panel/ds";
import { JourneyUnlockCheckout } from "@/components/panel/journey/JourneyUnlockCheckout";
import { pasajerosVozJurnex } from "@/lib/pasajeros-voz-jurnex";
import type { JourneyPhaseId } from "@/lib/journey-phases";
import { planProductoNormalizado } from "@/lib/evento-plan-access";
import type { CanalEnvioInvitacion, Evento } from "@/types/database";
import Link from "next/link";

export type JourneyPrimaryCtaProps = {
  invitados_count: number;
  /** Plan de producto (`eventos.plan`): esencial desbloquea envíos; experiencia el resto. */
  plan: Evento["plan"];
  payment_status?: "approved" | "rejected" | "pending" | null;
  invitaciones_enviadas: number;
  /** Admin y aún sin Experiencia (compra inicial o mejora desde Esencial). */
  canCheckout: boolean;
  eventoId: string | null;
  userEmail: string;
  prefillNombre: string;
  phase?: JourneyPhaseId;
  canalEnvioInvitacion?: CanalEnvioInvitacion | null;
};

function tienePlanEnvios(plan: Evento["plan"]): boolean {
  const n = planProductoNormalizado({ plan });
  return n === "esencial" || n === "experiencia";
}

/**
 * Bloque único "Siguiente escala": título, descripción y un solo CTA (enlace o checkout).
 */
export function JourneyPrimaryCta({
  invitados_count,
  plan,
  payment_status,
  invitaciones_enviadas,
  canCheckout,
  eventoId,
  userEmail,
  prefillNombre,
  phase = "check-in",
  canalEnvioInvitacion = null,
}: JourneyPrimaryCtaProps) {
  const enviosDesbloqueados = tienePlanEnvios(plan);
  const paymentStatus = payment_status ?? null;

  const hasInvitaciones = invitaciones_enviadas > 0;

  let title = "Siguiente paso ✈️";
  let text = "Agrega tus pasajeros para empezar el viaje";
  let ctaLabel = "Agregar pasajeros 👥";
  let href = "/panel/pasajeros";
  let mode: "link" | "checkout" = "link";

  // Prioridad: 1) Esencial o Experiencia, 2) pending, 3) rejected, 4) checkout, 5) etapa.
  if (enviosDesbloqueados) {
    title =
      planProductoNormalizado({ plan }) === "experiencia"
        ? "✨ Experiencia activada"
        : "Plan Esencial activo";
    if (phase === "check-in") {
      ctaLabel = `${pasajerosVozJurnex(canalEnvioInvitacion ?? "ambos").cta} ✈️`;
      href = "/panel/pasajeros/envios";
      text = hasInvitaciones
        ? "Comparte el acceso y sigue sumando a quienes vuelan contigo."
        : "Tu plan está activo: invita y completa los detalles cuando quieras.";
    } else if (phase === "despegue") {
      ctaLabel = "Ver programa";
      href = "/panel/viaje?tab=experiencia";
      text = "Coordina los últimos detalles y ten el día a mano, sin apuros.";
    } else {
      ctaLabel = "Ver experiencia";
      href = "/panel/viaje";
      text = "Muestra lo que armaste y comparte el momento con quienes vuelan contigo.";
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
        ? "Activa el viaje y coordina el programa con tus pasajeros."
        : phase === "en-vuelo"
          ? "Actívala para que tus invitados disfruten la experiencia completa."
          : "Todo lo que tus invitados van a vivir";
    ctaLabel = "Activar experiencia ✈️";
    if (canCheckout && eventoId) {
      mode = "checkout";
    } else {
      href = "/panel/finanzas";
    }
  } else if (phase === "check-in") {
    title = "Tu viaje comienza pronto ✈️";
    text = "Completa la información clave e invita cuando te sientas listo.";
    ctaLabel = "Completar viaje";
    href = "/panel/viaje?tab=tripulacion";
  } else if (phase === "despegue") {
    title = "Todo listo para el gran día";
    text = "Revisa el programa y coordina con tus pasajeros sin perder el ritmo.";
    ctaLabel = "Ver programa";
    href = "/panel/viaje?tab=experiencia";
  } else {
    title = "Disfruta la experiencia";
    text = "Explora lo que preparaste y compártelo con quienes vuelan contigo.";
    ctaLabel = "Ver experiencia";
    href = "/panel/viaje";
  }

  const ctaClasses = [panelCtaJurnexPrimary, panelCtaJurnexJourneyPillLayout].join(" ");

  const isCheckout = mode === "checkout" && Boolean(eventoId);

  if (isCheckout && eventoId) {
    return (
      <section
        className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-br from-[#0a0e18] via-[#0c101c] to-[#0f141d] p-4 shadow-none backdrop-blur-sm md:p-4"
        aria-label="Siguiente escala del viaje"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-invite-gold/85">Siguiente escala</p>
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
      className="relative overflow-hidden rounded-2xl border border-invite-gold/20 bg-gradient-to-br from-[#0b0f1a] via-[#0c101c] to-[#101828] p-4 shadow-[0_20px_48px_rgba(0,0,0,0.4)] backdrop-blur-md md:p-4"
      aria-label="Siguiente escala del viaje"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-invite-gold/[0.06] blur-3xl" aria-hidden />
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-invite-gold/85">Siguiente escala</p>
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
