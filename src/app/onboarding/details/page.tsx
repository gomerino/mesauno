import { EventDetailsForm } from "@/components/onboarding/journey/EventDetailsForm";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Detalles del evento — Dreams",
  robots: { index: false, follow: false },
};

export default function OnboardingDetailsPage() {
  return (
    <div>
      <h1 className="text-center font-display text-2xl font-bold text-white sm:text-3xl">Hacé único tu día</h1>
      <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-400">
        Lugar, vestimenta y un mensaje para quienes vuelan contigo. Se guarda automáticamente mientras escribís.
      </p>
      <div className="mt-10">
        <Suspense fallback={<p className="text-center text-slate-500">Cargando…</p>}>
          <EventDetailsForm />
        </Suspense>
      </div>
    </div>
  );
}
