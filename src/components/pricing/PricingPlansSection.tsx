"use client";

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
          ? "z-[1] border-[#D4AF37]/45 shadow-[0_28px_80px_rgba(212,175,55,0.12)] ring-1 ring-[#D4AF37]/30 lg:min-h-[560px] lg:scale-[1.03] lg:p-10"
          : "border-white/10 lg:min-h-[480px]",
      ].join(" ")}
    >
      {featured && planId === "experiencia" && "badge" in plan && plan.badge && (
        <div className="absolute -top-3 left-1/2 z-[2] -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0f172a] shadow-md">
          {plan.badge}
        </div>
      )}
      <div className="pt-1">
        <h2 className="font-display text-xl font-bold text-white sm:text-2xl">{plan.name}</h2>
        {"tagline" in plan && plan.tagline && (
          <p className="mt-2 text-sm font-medium text-[#D4AF37]/95">{plan.tagline}</p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-[15px]">{plan.description}</p>
      </div>
      <p className="mt-6 font-display text-3xl font-bold tracking-tight text-[#D4AF37] sm:text-4xl">{plan.priceLabel}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">Pago único · sin suscripciones</p>
      <ul className="mt-8 flex flex-1 flex-col gap-3 text-sm text-slate-300">
        {plan.features.map((line) => (
          <li key={line} className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/15 text-[#D4AF37] ring-1 ring-[#D4AF37]/25">
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
              ? "flex min-h-[52px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-6 text-sm font-semibold text-[#0f172a] shadow-lg shadow-black/25 transition hover:brightness-110 active:scale-[0.98]"
              : "flex min-h-[52px] w-full items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 active:scale-[0.98]"
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]/90">Planes</p>
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
