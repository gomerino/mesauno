"use client";

import {
  defaultJourneyState,
  type OnboardingJourneyState,
  saveJourneyToStorage,
} from "@/lib/onboarding-journey";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function OnboardingStep1Form() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [partner1, setPartner1] = useState("");
  const [partner2, setPartner2] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          partner1_name: partner1.trim(),
          partner2_name: partner2.trim(),
          event_date: eventDate,
        }),
      });
      const data = (await res.json()) as { id?: string; persisted?: boolean; error?: string };
      if (!res.ok || !data.id) {
        setErr(data.error ?? "No se pudo crear el evento");
        setBusy(false);
        return;
      }

      const state: OnboardingJourneyState = defaultJourneyState({
        eventId: data.id,
        persisted: Boolean(data.persisted),
        email: email.trim(),
        partner1_name: partner1.trim(),
        partner2_name: partner2.trim(),
        event_date: eventDate,
        guests: [],
      });
      saveJourneyToStorage(state);

      router.push(`/onboarding/preview?eventId=${encodeURIComponent(data.id)}`);
    } catch {
      setErr("Error de red. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur-sm"
    >
      {err ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">{err}</p>
      ) : null}

      <div>
        <label htmlFor="ob_email" className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
          Email
        </label>
        <input
          id="ob_email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.cl"
          className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
        />
      </div>
      <div>
        <label htmlFor="ob_p1" className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
          Nombre novio/a 1
        </label>
        <input
          id="ob_p1"
          required
          value={partner1}
          onChange={(e) => setPartner1(e.target.value)}
          placeholder="ej. Camila"
          className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
        />
      </div>
      <div>
        <label htmlFor="ob_p2" className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
          Nombre novio/a 2
        </label>
        <input
          id="ob_p2"
          required
          value={partner2}
          onChange={(e) => setPartner2(e.target.value)}
          placeholder="ej. Diego"
          className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
        />
      </div>
      <div>
        <label htmlFor="ob_date" className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
          Fecha del evento
        </label>
        <input
          id="ob_date"
          name="event_date"
          type="date"
          required
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/80 px-4 py-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="flex w-full min-h-[52px] items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] py-3.5 text-sm font-semibold text-[#0f172a] shadow-lg transition hover:brightness-110 disabled:opacity-60"
      >
        {busy ? "Creando tu viaje…" : "Crear mi viaje ✈️"}
      </button>
    </form>
  );
}
