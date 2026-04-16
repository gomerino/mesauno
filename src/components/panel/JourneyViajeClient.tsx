"use client";

import { JourneyCard } from "@/components/panel/journey/JourneyCard";
import type { PanelProgressBundle } from "@/lib/panel-progress-load";
import type { JourneyPhaseId } from "@/lib/journey-phases";
import { Plane } from "lucide-react";
import Link from "next/link";

type EventoViaje = NonNullable<PanelProgressBundle["evento"]>;

type Props = {
  evento: EventoViaje | null;
  invitadosCount: number;
  phase: JourneyPhaseId;
};

export function JourneyViajeClient({ evento, invitadosCount, phase }: Props) {
  if (!evento) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 text-center shadow-[0_0_40px_rgba(212,175,55,0.06)] backdrop-blur-md transition-all duration-500">
        <Plane className="mx-auto h-10 w-10 text-[#D4AF37]/80" aria-hidden />
        <p className="mt-4 text-lg font-semibold text-white">Todavía no tenés un viaje creado</p>
        <p className="mt-2 text-sm text-slate-400">Partimos desde acá: cargá los datos y entrá al panel.</p>
        <Link
          href="/onboarding"
          className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-8 text-sm font-semibold text-[#0f172a] shadow-[0_8px_32px_rgba(212,175,55,0.25)] transition hover:brightness-110"
        >
          Crear mi viaje ✈️
        </Link>
      </div>
    );
  }

  const isPaid = evento.plan_status === "paid";
  const invitadosOk = invitadosCount > 0;

  const focusEvento = phase === "check-in";
  const focusPasajeros = phase === "check-in";
  const focusPrograma = phase === "despegue";
  const focusExperiencia = phase === "en-vuelo";

  return (
    <div className="space-y-10 animate-fadeIn">
      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Navega por tu viaje</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:gap-6">
          <JourneyCard
            title="Evento"
            description="Tu destino ✈️"
            icon={<span aria-hidden>✈️</span>}
            status="active"
            href="/panel/evento"
            phaseHighlight={focusEvento}
          />
          <JourneyCard
            title="Pasajeros"
            description="Tu tripulación 👥"
            icon={<span aria-hidden>👥</span>}
            status={invitadosOk ? "completed" : "active"}
            href="/panel/invitados"
            phaseHighlight={focusPasajeros}
          />
          <JourneyCard
            title="Programa"
            description="Horarios y momentos clave 📋"
            icon={<span aria-hidden>📋</span>}
            status="active"
            href="/panel/programa"
            phaseHighlight={focusPrograma}
          />
          <JourneyCard
            title="Experiencia del viaje"
            description="Lo que vivirán ✨"
            icon={<span aria-hidden>✨</span>}
            status={isPaid ? "active" : "locked"}
            href={isPaid ? "/panel/experiencia" : undefined}
            phaseHighlight={focusExperiencia}
          />
        </div>
      </section>
    </div>
  );
}
