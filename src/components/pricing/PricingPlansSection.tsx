"use client";

import { panelCtaJurnexGoldAction, panelCtaJurnexGoldSurface, panelCtaJurnexPrimary } from "@/components/panel/ds";
import { CheckoutModal } from "@/components/CheckoutModal";
import { PRICING_PLANS, type PricingPlanId } from "@/lib/pricing-plans";
import { Check } from "lucide-react";
import { useState } from "react";

function PlanCard({
  planId,
  featured,
  onSelect,
}: {
  planId: PricingPlanId;
  featured: boolean;
  onSelect: (id: PricingPlanId) => void;
}) {
  const plan = PRICING_PLANS[planId];
  return (
    <div
      className={[
        "relative flex flex-col rounded-2xl border bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 shadow-lg backdrop-blur-sm sm:p-8",
        featured
          ? "z-[1] border-invite-gold/45 shadow-[0_28px_80px_rgba(212,175,55,0.12)] ring-1 ring-invite-gold/30 lg:min-h-[560px] lg:scale-[1.03] lg:p-10"
          : "border-white/10 lg:min-h-[480px]",
      ].join(" ")}
    >
      {featured && planId === "experiencia" && "badge" in plan && plan.badge && (
        <div
          className={
            "absolute -top-3 left-1/2 z-[2] -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1 text-[11px] font-bold uppercase tracking-wider " +
            panelCtaJurnexGoldSurface +
            " " +
            panelCtaJurnexGoldAction
          }
        >
          {plan.badge}
        </div>
      )}
      <div className="pt-1">
        <h2 className="font-display text-xl font-bold text-white sm:text-2xl">{plan.name}</h2>
        {"tagline" in plan && plan.tagline && (
          <p className="mt-2 text-sm font-medium text-invite-gold/95">{plan.tagline}</p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-[15px]">{plan.description}</p>
      </div>
      <p className="mt-6 font-display text-3xl font-bold tracking-tight text-invite-gold sm:text-4xl">{plan.priceLabel}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">Pago único · sin suscripciones</p>
      <ul className="mt-8 flex flex-1 flex-col gap-3 text-sm text-slate-300">
        {plan.features.map((line) => (
          <li key={line} className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-invite-gold/15 text-invite-gold ring-1 ring-invite-gold/25">
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
            </span>
            <span className="leading-snug">{line}</span>
          </li>
        ))}
      </ul>
      <div className="mt-10">
        <button
          type="button"
          onClick={() => onSelect(planId)}
          className={
            featured
              ? panelCtaJurnexPrimary + " min-h-[52px] w-full justify-center px-5 text-center leading-snug sm:px-6"
              : "flex min-h-[52px] w-full items-center justify-center rounded-full border border-white/20 bg-white/5 px-5 text-center text-sm font-semibold leading-snug text-white backdrop-blur-sm transition hover:bg-white/10 active:scale-[0.98] sm:px-6"
          }
        >
          {plan.cta}
        </button>
      </div>
    </div>
  );
}

export function PricingPlansSection() {
  const [modalPlan, setModalPlan] = useState<PricingPlanId | null>(null);

  return (
    <>
      <section className="border-b border-white/10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <header className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-invite-gold/90">Planes</p>
            <h1 className="mt-3 font-display text-[clamp(1.75rem,4.5vw,2.75rem)] font-bold leading-tight text-white">
              Elige cómo quieres vivir tu evento <span aria-hidden>✨</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              Pago único. Acceso completo para tu evento.
            </p>
          </header>

          <div className="mx-auto mt-14 grid max-w-5xl gap-8 lg:mt-20 lg:grid-cols-2 lg:items-start lg:gap-10 lg:pt-4">
            <PlanCard planId="esencial" featured={false} onSelect={setModalPlan} />
            <PlanCard planId="experiencia" featured onSelect={setModalPlan} />
          </div>
        </div>
      </section>
      <CheckoutModal open={modalPlan !== null} planId={modalPlan} onClose={() => setModalPlan(null)} />
    </>
  );
}
