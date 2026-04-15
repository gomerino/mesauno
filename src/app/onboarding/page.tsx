import { OnboardingStep1Form } from "@/components/onboarding/journey/OnboardingStep1Form";
import { OnboardingPlanNotice } from "@/components/onboarding/OnboardingPlanNotice";
import { selectEventoForMember } from "@/lib/evento-membership";
import { isPricingPlanId } from "@/lib/pricing-plans";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Tu viaje empieza aquí — Dreams",
  description: "Creá tu evento en segundos y mirá tu boarding pass al instante.",
};

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function OnboardingJourneyPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: evento } = await selectEventoForMember(supabase, user.id, "id");
    if (evento?.id) {
      redirect("/panel/evento");
    }
  }

  const raw = searchParams.plan;
  const planParam = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
  const planFromUrl = isPricingPlanId(planParam) ? planParam : null;

  return (
    <>
      <OnboardingPlanNotice planFromUrl={planFromUrl} />
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]/90">
        Onboarding · tu gran día como un viaje
      </p>
      <h1 className="mt-3 text-center font-display text-3xl font-bold text-white sm:text-4xl">
        Empezá con lo esencial
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-slate-400">
        En segundos generamos tu pase y podés personalizar cada detalle. Sin fricción: primero la emoción, después lo
        demás.
      </p>
      <div className="mt-10">
        <OnboardingStep1Form />
      </div>
      <p className="mt-10 text-center text-xs text-slate-500">
        ¿Solo querés mirar?{" "}
        <Link href="/invitacion/demo" className="text-[#D4AF37] hover:underline">
          Demo sin datos
        </Link>
      </p>
    </>
  );
}
