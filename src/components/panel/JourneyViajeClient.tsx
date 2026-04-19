"use client";

import { JourneyCard } from "@/components/panel/journey/JourneyCard";
import type { PanelProgressBundle } from "@/lib/panel-progress-load";
import type { JourneyPhaseId } from "@/lib/journey-phases";
import { guestMissionCtaLabel, type GuestMissionState } from "@/lib/guest-mission";
import { trackEvent } from "@/lib/analytics";
import { getPhaseBaseOrder, type JourneyCardKey } from "@/lib/journey-card-order";
import { Plane } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type EventoViaje = NonNullable<PanelProgressBundle["evento"]>;

type Props = {
  evento: EventoViaje | null;
  phase: JourneyPhaseId;
  /** Estado derivado por la fuente única (`resolveGuestMissionState`). */
  invitadosMission: GuestMissionState;
  /** `"invitados"` / `"pasajeros"` / `"evento"` / `"programa"` / `"experiencia"`. */
  focusTarget?: string | null;
  /** Básicos del evento completos (novios + fecha). */
  eventoComplete: boolean;
  /** Cantidad de hitos del programa del día. */
  programaHitosCount: number;
};

function missionDescription(state: GuestMissionState): string {
  switch (state) {
    case "empty":
      return "Aún no invitaste a nadie";
    case "in_progress":
      return "Sigue tu tripulación 👥";
    case "completed":
      return "Tripulación lista ✓";
  }
}

/** Emite `mission_card_completed` una sola vez por sesión para cada misión. */
function emitIfCompletedOnce(target: "invitados" | "evento", completed: boolean) {
  if (typeof window === "undefined") return;
  if (!completed) return;
  try {
    const key = `jurnex:mission_completed:${target}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    trackEvent("mission_card_completed", { target });
  } catch {
    // no-op
  }
}

export function JourneyViajeClient({
  evento,
  phase,
  invitadosMission,
  focusTarget = null,
  eventoComplete,
  programaHitosCount,
}: Props) {
  useEffect(() => {
    emitIfCompletedOnce("invitados", invitadosMission === "completed");
    emitIfCompletedOnce("evento", eventoComplete);
  }, [invitadosMission, eventoComplete]);

  const isPaid = evento?.plan_status === "paid";

  const phaseFocusEvento = phase === "check-in";
  const phaseFocusPasajeros = phase === "check-in";
  const phaseFocusPrograma = phase === "despegue";
  const phaseFocusExperiencia = phase === "en-vuelo";

  const focusIs = (id: string) =>
    focusTarget === id ||
    (id === "pasajeros" && focusTarget === "invitados") ||
    (id === "invitados" && focusTarget === "pasajeros");

  // Evento
  const eventoDescription = eventoComplete ? "Destino confirmado ✓" : "Define tu destino ✈️";
  const eventoCardStatus = eventoComplete ? "completed" : "active";
  const eventoCta = eventoComplete ? "Editar destino" : "Completar destino";

  // Pasajeros
  const pasajerosCardStatus = invitadosMission === "completed" ? "completed" : "active";
  const pasajerosCta = guestMissionCtaLabel(invitadosMission);
  const pasajerosDescription = missionDescription(invitadosMission);
  const pasajerosHref = "/panel/invitados?from=mission";
  const pasajerosFocused = focusIs("pasajeros");

  // Programa
  const tieneHitos = programaHitosCount > 0;
  const programaDescription = tieneHitos
    ? `${programaHitosCount} ${programaHitosCount === 1 ? "momento definido" : "momentos definidos"}`
    : "Horarios y momentos clave 📋";
  const programaCta = tieneHitos ? "Editar programa" : "Armar programa";
  const programaCardStatus: "completed" | "active" = tieneHitos ? "completed" : "active";

  // Experiencia
  const experienciaDescription = "Lo que vivirán ✨";
  const experienciaCta = "Personalizar experiencia";

  type MissionStatus = "empty" | "in_progress" | "completed" | "locked";

  const eventoMissionStatus: MissionStatus = eventoComplete ? "completed" : "empty";
  const pasajerosMissionStatus: MissionStatus = invitadosMission;
  const programaMissionStatus: MissionStatus = tieneHitos ? "in_progress" : "empty";
  const experienciaMissionStatus: MissionStatus = isPaid ? "empty" : "locked";

  /** Base por fase: menor = más arriba. Tabla única en `getPhaseBaseOrder` (JUR-51). */
  const phaseBase = getPhaseBaseOrder(phase);

  /** Penalización por estado: lo ya resuelto cae al final sin desaparecer. */
  function statusPenalty(s: MissionStatus): number {
    switch (s) {
      case "empty":
        return 0;
      case "in_progress":
        return 2;
      case "completed":
        return 20;
      case "locked":
        return 30;
    }
  }

  type CardSpec = {
    key: JourneyCardKey;
    status: MissionStatus;
    rank: number;
    node: ReactNode;
  };

  const cards: CardSpec[] = [
    {
      key: "evento",
      status: eventoMissionStatus,
      rank: phaseBase.evento + statusPenalty(eventoMissionStatus),
      node: (
        <JourneyCard
          key="evento"
          title="Evento"
          description={eventoDescription}
          icon={<span aria-hidden>✈️</span>}
          status={eventoCardStatus}
          href="/panel/evento?from=mission"
          phaseHighlight={phaseFocusEvento || focusIs("evento")}
          ctaLabel={eventoCta}
          pulse={focusIs("evento")}
          onNavigate={() =>
            trackEvent("panel_mission_cta_clicked", {
              target: "evento",
              state: eventoComplete ? "completed" : "in_progress",
            })
          }
        />
      ),
    },
    {
      key: "pasajeros",
      status: pasajerosMissionStatus,
      rank: phaseBase.pasajeros + statusPenalty(pasajerosMissionStatus),
      node: (
        <JourneyCard
          key="pasajeros"
          title="Pasajeros"
          description={pasajerosDescription}
          icon={<span aria-hidden>👥</span>}
          status={pasajerosCardStatus}
          href={pasajerosHref}
          phaseHighlight={phaseFocusPasajeros || pasajerosFocused}
          ctaLabel={pasajerosCta}
          pulse={pasajerosFocused}
          onNavigate={() =>
            trackEvent("panel_mission_cta_clicked", {
              target: "invitados",
              state: invitadosMission,
            })
          }
        />
      ),
    },
    {
      key: "programa",
      status: programaMissionStatus,
      rank: phaseBase.programa + statusPenalty(programaMissionStatus),
      node: (
        <JourneyCard
          key="programa"
          title="Programa"
          description={programaDescription}
          icon={<span aria-hidden>📋</span>}
          status={programaCardStatus}
          href="/panel/programa?from=mission"
          phaseHighlight={phaseFocusPrograma || focusIs("programa")}
          ctaLabel={programaCta}
          pulse={focusIs("programa")}
          onNavigate={() =>
            trackEvent("panel_mission_cta_clicked", {
              target: "programa",
              state: tieneHitos ? "in_progress" : "empty",
            })
          }
        />
      ),
    },
    {
      key: "experiencia",
      status: experienciaMissionStatus,
      rank: phaseBase.experiencia + statusPenalty(experienciaMissionStatus),
      node: (
        <JourneyCard
          key="experiencia"
          title="Experiencia del viaje"
          description={experienciaDescription}
          icon={<span aria-hidden>✨</span>}
          status={isPaid ? "active" : "locked"}
          href={isPaid ? "/panel/experiencia?from=mission" : undefined}
          phaseHighlight={phaseFocusExperiencia || focusIs("experiencia")}
          ctaLabel={isPaid ? experienciaCta : undefined}
          pulse={isPaid && focusIs("experiencia")}
          onNavigate={
            isPaid
              ? () =>
                  trackEvent("panel_mission_cta_clicked", {
                    target: "experiencia",
                    state: "active",
                  })
              : undefined
          }
        />
      ),
    },
  ];

  const ordered = [...cards].sort((a, b) => a.rank - b.rank);
  const topActionable = ordered.find((c) => c.status === "empty" || c.status === "in_progress");

  const [isNarrowViewport, setIsNarrowViewport] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsNarrowViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /** Mobile: la tarjeta “Siguiente” arriba del todo; desktop/tablet: orden por fase + penalización. */
  const displayOrdered = useMemo(() => {
    if (!isNarrowViewport || !topActionable) return ordered;
    if (ordered[0]?.key === topActionable.key) return ordered;
    return [topActionable, ...ordered.filter((c) => c.key !== topActionable.key)];
  }, [isNarrowViewport, ordered, topActionable]);

  const orderKeys = displayOrdered.map((c) => c.key).join("|");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const key = `jurnex:mission_order:${phase}:${orderKeys}`;
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
      trackEvent("panel_mission_order", { phase, order: orderKeys });
    } catch {
      // no-op
    }
  }, [phase, orderKeys]);

  if (!evento) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 text-center shadow-[0_0_40px_rgba(212,175,55,0.06)] backdrop-blur-md transition-all duration-500">
        <Plane className="mx-auto h-10 w-10 text-[#D4AF37]/80" aria-hidden />
        <p className="mt-4 text-lg font-semibold text-white">Todavía no tienes un viaje creado</p>
        <p className="mt-2 text-sm text-slate-400">Empezamos desde aquí: carga los datos e ingresa al panel.</p>
        <Link
          href="/onboarding"
          className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-8 text-sm font-semibold text-[#0f172a] shadow-[0_8px_32px_rgba(212,175,55,0.25)] transition hover:brightness-110"
        >
          Crear mi viaje ✈️
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4 animate-fadeIn">
      <section>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Para despegar</h2>
          {topActionable ? (
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-teal-300/80">
              Siguiente: {labelForKey(topActionable.key)}
            </span>
          ) : null}
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:mt-4 md:gap-4">
          {displayOrdered.map((c) => c.node)}
        </div>
      </section>
    </div>
  );
}

function labelForKey(key: JourneyCardKey): string {
  switch (key) {
    case "evento":
      return "Evento";
    case "pasajeros":
      return "Pasajeros";
    case "programa":
      return "Programa";
    case "experiencia":
      return "Experiencia";
  }
}
