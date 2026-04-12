import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Crear invitación — Dreams Wedding",
  description: "Primer paso: nombre de los novios y fecha del evento. Vista previa instantánea estilo boarding pass.",
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1222] via-[#0f172a] to-[#020617]">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]/90">Paso 1 de 2</p>
        <h1 className="mt-2 text-center font-display text-3xl font-bold text-white sm:text-4xl">Crea tu invitación</h1>
        <p className="mx-auto mt-3 max-w-md text-center text-sm text-slate-400">
          En segundos verás tu boarding pass con estos datos. Sin cuenta todavía.
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
