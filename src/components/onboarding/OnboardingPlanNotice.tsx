"use client";

import {
  isPricingPlanId,
  PRICING_PLAN_STORAGE_KEY,
  planDisplayName,
  type PricingPlanId,
} from "@/lib/pricing-plans";
import { useEffect, useState } from "react";

type Props = {
  planFromUrl: PricingPlanId | null;
};

export function OnboardingPlanNotice({ planFromUrl }: Props) {
  const [plan, setPlan] = useState<PricingPlanId | null>(planFromUrl);

  useEffect(() => {
    if (planFromUrl) return;
    try {
      const raw = localStorage.getItem(PRICING_PLAN_STORAGE_KEY);
      if (isPricingPlanId(raw)) setPlan(raw);
    } catch {
      /* ignore */
    }
  }, [planFromUrl]);

  if (!plan) return null;

  return (
    <div className="mb-8 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-3 text-center text-sm text-slate-200">
      <span className="font-semibold text-[#D4AF37]">{planDisplayName(plan)}</span>
      <span className="text-slate-400"> — listo para configurar después de tu vista previa.</span>
    </div>
  );
}
