import { TravelGroupForm } from "@/components/onboarding/journey/TravelGroupForm";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Invitados — Dreams",
  robots: { index: false, follow: false },
};

export default function OnboardingGuestsPage() {
  return (
    <div>
      <h1 className="text-center font-display text-2xl font-bold text-white sm:text-3xl">Tu grupo de viaje</h1>
      <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-400">
        Pasajero principal y acompañantes. Podés cargar ahora o más tarde; el pase de vista previa usa estos datos.
      </p>
      <div className="mt-10">
        <Suspense fallback={<p className="text-center text-slate-500">Cargando…</p>}>
          <TravelGroupForm />
        </Suspense>
      </div>
    </div>
  );
}
