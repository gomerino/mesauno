"use client";

import { BoardingPassPreview } from "@/components/onboarding/journey/BoardingPassPreview";
import { OnboardingPaywallModal } from "@/components/onboarding/journey/OnboardingPaywallModal";
import {
  defaultJourneyState,
  loadJourneyFromStorage,
  type OnboardingJourneyState,
} from "@/lib/onboarding-journey";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function OnboardingFullClient() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") ?? "";
  const [state, setState] = useState<OnboardingJourneyState | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    const s = loadJourneyFromStorage();
    if (s && s.eventId === eventId) {
      setState(s);
      return;
    }
    if (eventId) {
      setState(
        defaultJourneyState({
          eventId,
          persisted: false,
          email: "",
          partner1_name: "Novio/a",
          partner2_name: "Novio/a",
          event_date: new Date().toISOString().slice(0, 10),
          guests: [],
        })
      );
    }
  }, [eventId]);

  if (!eventId) {
    return (
      <p className="text-center text-sm text-slate-400">
        <Link href="/onboarding" className="text-[#D4AF37] hover:underline">
          Empezar tu viaje
        </Link>
      </p>
    );
  }

  if (!state) {
    return <p className="text-center text-sm text-slate-400">Cargando…</p>;
  }

  return (
    <div className="flex flex-col items-center">
      <p className="mb-4 max-w-md text-center text-sm text-slate-400">
        Así verá un invitado tu boarding pass (simulación). Tu invitación pública mantiene el mismo estilo premium.
      </p>
      <div className="animate-onboardingReveal w-full max-w-md">
        <BoardingPassPreview state={state} />
      </div>
      <button
        type="button"
        onClick={() => setPaywallOpen(true)}
        className="mt-10 flex min-h-[52px] w-full max-w-md items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-6 text-sm font-semibold text-[#0f172a] shadow-xl transition hover:brightness-110"
      >
        Mandar invitaciones ✈️
      </button>
      <p className="mt-6 text-center text-xs text-slate-500">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login?next=/panel" className="text-[#D4AF37] hover:underline">
          Ir al panel
        </Link>
      </p>
      <OnboardingPaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        eventId={eventId}
        prefillNombre={[state.partner1_name, state.partner2_name].filter(Boolean).join(" & ")}
        prefillEmail={state.email}
      />
    </div>
  );
}
