import { OnboardingPreviewClient } from "@/components/onboarding/journey/OnboardingPreviewClient";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Tu pase — Jurnex",
  description: "Vista previa instantánea de tu invitación estilo boarding pass.",
};

export default function OnboardingPreviewPage() {
  return (
    <div>
      <h1 className="text-center font-display text-2xl font-bold text-white sm:text-3xl">Aquí empieza tu viaje</h1>
      <p className="mx-auto mt-2 max-w-md text-center text-sm text-slate-400">
        Así se ve tu pase con lo que nos has contado. Puedes seguir afinándolo en un paso.
      </p>
      <div className="mt-10">
        <Suspense
          fallback={
            <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-500">Cargando pase…</div>
          }
        >
          <OnboardingPreviewClient />
        </Suspense>
      </div>
    </div>
  );
}
