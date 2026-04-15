"use client";

import {
  defaultJourneyState,
  loadJourneyFromStorage,
  saveJourneyToStorage,
  type OnboardingGuestDraft,
  type OnboardingJourneyState,
} from "@/lib/onboarding-journey";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function GuestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") ?? "";

  const [state, setState] = useState<OnboardingJourneyState | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

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
          partner1_name: "",
          partner2_name: "",
          event_date: "",
          guests: [],
        })
      );
    }
  }, [eventId]);

  function pushGuest(g: OnboardingGuestDraft) {
    setState((prev) => {
      if (!prev) return prev;
      const next: OnboardingJourneyState = { ...prev, guests: [...prev.guests, g] };
      saveJourneyToStorage(next);
      return next;
    });
    setName("");
    setEmail("");
    setPhone("");
  }

  async function addGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !state) return;
    setBusy(true);
    const g: OnboardingGuestDraft = {
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    };
    if (state.persisted) {
      try {
        await fetch(`/api/events/${encodeURIComponent(eventId)}/guests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: g.name, email: g.email, phone: g.phone }),
        });
      } catch {
        /* still add locally */
      }
    }
    pushGuest(g);
    setBusy(false);
  }

  function addDemoGuest() {
    pushGuest({ name: "María González (demo)", email: "maria@ejemplo.cl" });
  }

  if (!eventId || !state) {
    return (
      <p className="text-center text-sm text-slate-400">
        <Link href="/onboarding" className="text-[#D4AF37] hover:underline">
          Empezar de nuevo
        </Link>
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <form
        onSubmit={(e) => void addGuest(e)}
        className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6"
      >
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Nombre del invitado"
            className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/80 px-4 py-3 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
            Email (opcional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/80 px-4 py-3 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
            Teléfono (opcional)
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/80 px-4 py-3 text-sm text-white"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="w-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] py-3 text-sm font-semibold text-[#0f172a] disabled:opacity-50"
        >
          {busy ? "Añadiendo…" : "Añadir a la lista"}
        </button>
      </form>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => addDemoGuest()}
          className="flex-1 rounded-full border border-white/15 py-3 text-sm font-medium text-white hover:bg-white/5"
        >
          Añadir invitado demo
        </button>
        <button
          type="button"
          onClick={() => router.push(`/onboarding/full?eventId=${encodeURIComponent(eventId)}`)}
          className="flex-1 rounded-full border border-white/15 py-3 text-sm font-medium text-slate-300 hover:bg-white/5"
        >
          Agregar después
        </button>
      </div>

      {state.guests.length > 0 ? (
        <ul className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
          {state.guests.map((g, i) => (
            <li key={`${g.name}-${i}`} className="border-b border-white/5 py-2 last:border-0">
              {g.name}
              {g.email ? <span className="block text-xs text-slate-500">{g.email}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={() => router.push(`/onboarding/full?eventId=${encodeURIComponent(eventId)}`)}
        className="w-full rounded-full bg-white/10 py-3 text-sm font-semibold text-white hover:bg-white/15"
      >
        Ver invitación completa
      </button>
    </div>
  );
}
