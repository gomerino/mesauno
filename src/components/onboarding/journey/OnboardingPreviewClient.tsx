"use client";

import { BoardingPassPreview } from "@/components/onboarding/journey/BoardingPassPreview";
import {
  defaultJourneyState,
  loadJourneyFromStorage,
  saveJourneyToStorage,
  type OnboardingJourneyState,
} from "@/lib/onboarding-journey";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function OnboardingPreviewClient() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("eventId") ?? "";

  const [state, setState] = useState<OnboardingJourneyState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const fromStorage = loadJourneyFromStorage();
    if (fromStorage && fromStorage.eventId === eventIdParam) {
      setState(fromStorage);
      setHydrated(true);
      return;
    }
    if (eventIdParam) {
      setState(
        defaultJourneyState({
          eventId: eventIdParam,
          persisted: false,
          email: "",
          partner1_name: "Tu pareja",
          partner2_name: "& Tú",
          event_date: new Date().toISOString().slice(0, 10),
          guests: [],
        })
      );
      setHydrated(true);
    }
  }, [eventIdParam]);

  useEffect(() => {
    if (!eventIdParam || !hydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/events/${encodeURIComponent(eventIdParam)}`);
        if (!res.ok) return;
        const row = (await res.json()) as Record<string, unknown>;
        if (cancelled) return;
        setState((prev) => {
          const base =
            prev ??
            defaultJourneyState({
              eventId: eventIdParam,
              persisted: true,
              email: "",
              partner1_name: "",
              partner2_name: "",
              event_date: "",
              guests: [],
            });
          const next: OnboardingJourneyState = {
            ...base,
            persisted: true,
            partner1_name: String(row.nombre_novio_1 ?? base.partner1_name),
            partner2_name: String(row.nombre_novio_2 ?? base.partner2_name),
            event_date: String(row.fecha_boda ?? row.fecha_evento ?? base.event_date).slice(0, 10),
            event_name: row.nombre_evento ? String(row.nombre_evento) : base.event_name,
            location_name: row.destino ? String(row.destino) : base.location_name,
            message: row.motivo_viaje ? String(row.motivo_viaje) : base.message,
          };
          if (row.lugar_evento_linea) {
            const line = String(row.lugar_evento_linea);
            const parts = line.split(" · ");
            next.location_name = parts[0] ?? next.location_name;
            next.address = parts.slice(1).join(" · ") || next.address;
          }
          saveJourneyToStorage(next);
          return next;
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventIdParam, hydrated]);

  const ready = useMemo(() => Boolean(state && eventIdParam), [state, eventIdParam]);

  if (!eventIdParam) {
    return (
      <p className="text-center text-sm text-slate-400">
        Falta el evento.{" "}
        <Link href="/onboarding" className="text-[#D4AF37] hover:underline">
          Volver al inicio
        </Link>
      </p>
    );
  }

  if (!ready || !state) {
    return (
      <div className="mx-auto flex min-h-[320px] max-w-sm flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <div className="h-10 w-10 animate-pulse rounded-full bg-[#D4AF37]/30" />
        <p className="text-sm text-slate-400">Preparando tu pase…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="animate-onboardingReveal w-full max-w-md">
        <BoardingPassPreview state={state} />
      </div>
      <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/onboarding/details?eventId=${encodeURIComponent(eventIdParam)}`}
          className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-6 text-sm font-semibold text-[#0f172a] shadow-lg transition hover:brightness-110"
        >
          Personalizar mi viaje
        </Link>
        <Link
          href={`/onboarding/full?eventId=${encodeURIComponent(eventIdParam)}`}
          className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-medium text-slate-200 hover:bg-white/5"
        >
          Continuar después
        </Link>
      </div>
    </div>
  );
}
