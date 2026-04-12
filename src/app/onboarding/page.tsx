import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { OnboardingPlanNotice } from "@/components/onboarding/OnboardingPlanNotice";
import { SiteHeader } from "@/components/SiteHeader";
import { selectEventoForMember } from "@/lib/evento-membership";
import { createClient } from "@/lib/supabase/server";
import { isPricingPlanId } from "@/lib/pricing-plans";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Crear mi evento — Dreams",
  description: "Primer paso: nombre del evento o pareja y fecha. Vista previa instantánea estilo boarding pass.",
};

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function OnboardingPage({ searchParams }: PageProps) {
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
    <div className="min-h-screen bg-gradient-to-b from-[#0c1222] via-[#0f172a] to-[#020617]">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <OnboardingPlanNotice planFromUrl={planFromUrl} />
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]/90">Paso 1 de 2</p>
        <h1 className="mt-2 text-center font-display text-3xl font-bold text-white sm:text-4xl">Empieza tu evento</h1>
        <p className="mx-auto mt-3 max-w-md text-center text-sm text-slate-400">
          {user
            ? "Completa la vista previa de tu invitación boarding pass."
            : "En segundos verás tu boarding pass con estos datos. Sin cuenta todavía."}
        </p>
        <div className="mt-10">
          <OnboardingForm />
        </div>
        <p className="mt-8 text-center text-xs text-slate-500">
          ¿Solo mirando?{" "}
          <Link href="/invitacion/demo" className="text-[#D4AF37] hover:underline">
            Ver demo sin formulario
          </Link>
        </p>
      </main>
    </div>
  );
}
