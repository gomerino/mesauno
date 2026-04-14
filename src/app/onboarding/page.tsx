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
  title: "Vista previa gratuita — Dreams",
  description:
    "Prueba la invitación estilo boarding pass con datos de ejemplo. No guarda tu evento; contrata un plan para activarlo de verdad.",
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
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]/90">
          Vista previa gratuita — no guarda tu evento
        </p>
        <h1 className="mt-2 text-center font-display text-3xl font-bold text-white sm:text-4xl">Prueba tu invitación</h1>
        <p className="mx-auto mt-3 max-w-md text-center text-sm text-slate-400">
          {user
            ? "Personaliza la demo y mira el boarding pass al instante. Tu evento real lo configuras en el panel tras contratar."
            : "En segundos verás un boarding pass de ejemplo. No se crea cuenta ni evento hasta que contrates un plan."}
        </p>
        <div className="mt-10">
          <OnboardingForm />
        </div>
        <div className="mt-10 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.06] px-5 py-6 text-center">
          <p className="text-sm font-medium text-white">¿Quieres tu evento de verdad con invitación y panel?</p>
          <p className="mt-2 text-xs text-slate-400">Un pago único. Invitados, RSVP y más.</p>
          <Link
            href="/pricing"
            className="mt-4 inline-flex min-h-[48px] w-full max-w-sm items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-6 text-sm font-semibold text-[#0f172a] shadow-lg transition hover:brightness-110 sm:w-auto"
          >
            Guardar mi evento real
          </Link>
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
