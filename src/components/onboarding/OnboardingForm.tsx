"use client";

import { ONBOARDING_DEMO_STORAGE_KEY, type OnboardingDemoPayload } from "@/lib/demo-invitation-mock";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function OnboardingForm() {
  const router = useRouter();
  const [nombreNovios, setNombreNovios] = useState("");
  const [fechaEvento, setFechaEvento] = useState("");
  const [busy, setBusy] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload: OnboardingDemoPayload = {
      nombreNovios: nombreNovios.trim() || "Camila & Diego",
      fechaEvento: fechaEvento.trim() || new Date().toISOString().slice(0, 10),
    };
    try {
      localStorage.setItem(ONBOARDING_DEMO_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota */
    }
    router.push("/invitacion/demo");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-md space-y-5 rounded-xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur-sm"
    >
      <div>
        <label htmlFor="nombre_novios" className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
          Nombre del evento o pareja
        </label>
        <input
          id="nombre_novios"
          name="nombre_novios"
          type="text"
          autoComplete="off"
          placeholder="ej. Camila & Diego"
          value={nombreNovios}
          onChange={(e) => setNombreNovios(e.target.value)}
          className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
        />
      </div>
      <div>
        <label htmlFor="fecha_evento" className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
          Fecha del evento
        </label>
        <input
          id="fecha_evento"
          name="fecha_evento"
          type="date"
          value={fechaEvento}
          onChange={(e) => setFechaEvento(e.target.value)}
          className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/80 px-4 py-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="flex w-full min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] py-3 text-sm font-semibold text-[#0f172a] transition hover:brightness-110 disabled:opacity-60"
      >
        {busy ? "Preparando tu pase…" : "Ver vista previa del evento"}
      </button>
    </form>
  );
}
