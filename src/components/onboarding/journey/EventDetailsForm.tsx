"use client";

import {
  defaultJourneyState,
  loadJourneyFromStorage,
  saveJourneyToStorage,
  type OnboardingJourneyState,
} from "@/lib/onboarding-journey";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function EventDetailsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") ?? "";

  const [state, setState] = useState<OnboardingJourneyState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const persistRemote = useCallback(
    async (next: OnboardingJourneyState) => {
      if (!next.persisted) return;
      const lugar = [next.location_name, next.address].filter(Boolean).join(" · ");
      const motivo = [next.message?.trim(), next.dress_code?.trim() ? `Dress code: ${next.dress_code}` : ""]
        .filter(Boolean)
        .join("\n\n");
      try {
        const res = await fetch(`/api/events/${encodeURIComponent(next.eventId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre_evento: next.event_name ?? null,
            destino: next.location_name ?? null,
            lugar_evento_linea: lugar || null,
            motivo_viaje: motivo || null,
          }),
        });
        if (res.ok) {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }
      } catch {
        /* ignore */
      }
    },
    []
  );

  const updateField = useCallback(
    (patch: Partial<OnboardingJourneyState>) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        saveJourneyToStorage(next);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          void persistRemote(next);
        }, 900);
        return next;
      });
    },
    [persistRemote]
  );

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
    <div className="mx-auto w-full max-w-lg space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
          Nombre del evento
        </label>
        <input
          value={state.event_name ?? ""}
          onChange={(e) => updateField({ event_name: e.target.value })}
          placeholder="ej. La boda de Camila & Diego"
          className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/80 px-4 py-3 text-sm text-white placeholder:text-slate-500"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
          Lugar (nombre)
        </label>
        <input
          value={state.location_name ?? ""}
          onChange={(e) => updateField({ location_name: e.target.value })}
          placeholder="ej. Viña Santa Rita"
          className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/80 px-4 py-3 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
          Dirección
        </label>
        <input
          value={state.address ?? ""}
          onChange={(e) => updateField({ address: e.target.value })}
          placeholder="Calle, comuna, región"
          className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/80 px-4 py-3 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
          Dress code
        </label>
        <input
          value={state.dress_code ?? ""}
          onChange={(e) => updateField({ dress_code: e.target.value })}
          placeholder="ej. Elegante / Cocktail"
          className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/80 px-4 py-3 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
          Mensaje (opcional)
        </label>
        <textarea
          value={state.message ?? ""}
          onChange={(e) => updateField({ message: e.target.value })}
          rows={3}
          placeholder="Unas palabras para tus invitados…"
          className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/80 px-4 py-3 text-sm text-white placeholder:text-slate-500"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            if (!state) return;
            setSaving(true);
            void persistRemote(state).finally(() => setSaving(false));
          }}
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
        >
          {saving ? "Guardando…" : "Guardar ahora"}
        </button>
        {saved ? <span className="text-xs text-emerald-400">Guardado</span> : null}
      </div>

      <button
        type="button"
        onClick={() => router.push(`/onboarding/guests?eventId=${encodeURIComponent(eventId)}`)}
        className="w-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] py-3 text-sm font-semibold text-[#0f172a]"
      >
        Siguiente: invitados
      </button>
    </div>
  );
}
