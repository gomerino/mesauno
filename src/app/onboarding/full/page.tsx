import { OnboardingFullClient } from "@/components/onboarding/journey/OnboardingFullClient";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Vista completa — Dreams",
  robots: { index: false, follow: false },
};

export default function OnboardingFullPage() {
  return (
    <div>
      <h1 className="text-center font-display text-2xl font-bold text-white sm:text-3xl">Tu invitación completa</h1>
      <div className="mt-10">
        <Suspense fallback={<p className="text-center text-slate-500">Cargando…</p>}>
          <OnboardingFullClient />
        </Suspense>
      </div>
    </div>
  );
}
