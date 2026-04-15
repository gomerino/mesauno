import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { selectEventoForMember } from "@/lib/evento-membership";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Crear tu viaje — Dreams",
  description: "Creá tu cuenta y tu evento en un solo paso. Sin demo: directo al panel.",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: evento } = await selectEventoForMember(supabase, user.id, "id");
    if (evento?.id) {
      redirect("/panel");
    }
  }

  return (
    <>
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]/90">
        Tu gran día como un viaje
      </p>
      <h1 className="mt-3 text-center font-display text-3xl font-bold text-white sm:text-4xl">Creá tu viaje</h1>
      <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-slate-400">
        Dejá tu correo y los datos básicos. Te llevamos al panel para seguir armando todo sin vueltas.
      </p>
      <div className="mt-10">
        <OnboardingForm />
      </div>
    </>
  );
}
