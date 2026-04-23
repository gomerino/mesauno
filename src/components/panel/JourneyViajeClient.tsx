"use client";

import { JourneyCard } from "@/components/panel/journey/JourneyCard";
import type { PanelProgressBundle } from "@/lib/panel-progress-load";
import { getViajeMissionStripFromSteps } from "@/lib/viaje-mission";
import type { JourneyPhaseId } from "@/lib/journey-phases";
import type { JourneyStepId } from "@/lib/panel-setup-progress";
import {
  GUEST_MISSION_ORDER,
  guestMissionCtaLabelFromSteps,
  guestMissionDescriptionFromSteps,
  guestMissionStripProps,
  type GuestMissionSteps,
} from "@/lib/guest-mission";
import { trackEvent } from "@/lib/analytics";
import { getPhaseBaseOrder, type JourneyCardKey } from "@/lib/journey-card-order";
import {
  getRecuerdosFotosMissionStrip,
  hasRecuerdosFotosDownloadMisionDone,
  recuerdosMisionCtaLabel,
  recuerdosMisionDescription,
  RECUERDOS_MISSION_EVENT,
  recuerdosMissionStorageKey,
} from "@/lib/recuerdos-mission";
import { Plane, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

type EventoViaje = NonNullable<PanelProgressBundle["evento"]>;

type Props = {
  evento: EventoViaje | null;
  phase: JourneyPhaseId;
  /** Misiones de invitados (lista, mesas, envío, meta); misma fuente que la página Pasajeros. */
  guestMissionSteps: GuestMissionSteps;
  /** `"invitados"` / `"pasajeros"` / `"evento"` / `"experiencia"` / `"aterrizaje"` / `"recuerdos"` (Aterrizaje). */
  focusTarget?: string | null;
  /** Las 4 misiones de configuración del viaje completas (misma fuente que `bundle.steps`). */
  eventoComplete: boolean;
  /** Pasos `evento_datos` … `evento_musica`; misma fuente que el % del panel. */
  journeySteps: Record<JourneyStepId, boolean>;
};

/** Emite `mission_card_completed` una sola vez por sesión para cada misión. */
function emitIfCompletedOnce(
  target: "invitados" | "evento" | "recuerdos",
  completed: boolean
) {
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
  guestMissionSteps,
  focusTarget = null,
  eventoComplete,
  journeySteps,
}: Props) {
  const invitadosMissionDone = GUEST_MISSION_ORDER.every((id) => guestMissionSteps[id]);
  const [recuerdosDescargaHecha, setRecuerdosDescargaHecha] = useState(false);

  useEffect(() => {
    emitIfCompletedOnce("invitados", invitadosMissionDone);
    emitIfCompletedOnce("evento", eventoComplete);
    emitIfCompletedOnce("recuerdos", recuerdosDescargaHecha);
  }, [invitadosMissionDone, eventoComplete, recuerdosDescargaHecha]);

  useEffect(() => {
    if (!evento?.id) {
      setRecuerdosDescargaHecha(false);
      return;
    }
    const id = evento.id;
    setRecuerdosDescargaHecha(hasRecuerdosFotosDownloadMisionDone(id));
    const onCustom = (e: Event) => {
      const d = (e as CustomEvent<{ eventoId?: string }>).detail;
      if (d?.eventoId === id) setRecuerdosDescargaHecha(true);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === recuerdosMissionStorageKey(id) && e.newValue === "1") {
        setRecuerdosDescargaHecha(true);
      }
    };
    window.addEventListener(RECUERDOS_MISSION_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(RECUERDOS_MISSION_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [evento?.id]);

  const isPaid = evento?.plan_status === "paid";

  const phaseFocusEvento = phase === "check-in";
  const phaseFocusPasajeros = phase === "check-in";
  const phaseFocusExperiencia = phase === "en-vuelo";

  const focusIs = (id: string) =>
    focusTarget === id ||
    (id === "pasajeros" && focusTarget === "invitados") ||
    (id === "invitados" && focusTarget === "pasajeros") ||
    (id === "experiencia" && (focusTarget === "aterrizaje" || focusTarget === "recuerdos"));

  // Viaje (franja = 4 pasos de configuración)
  const eventoDescription = eventoComplete
    ? "Viaje configurado ✓"
    : "Datos, lugar, programa y música";
  const eventoCardStatus = eventoComplete ? "completed" : "active";
  const eventoCta = eventoComplete ? "Revisar viaje" : "Completar viaje";

  // Pasajeros
  const pasajerosCardStatus = invitadosMissionDone ? "completed" : "active";
  const pasajerosCta = guestMissionCtaLabelFromSteps(guestMissionSteps);
  const pasajerosDescription = guestMissionDescriptionFromSteps(guestMissionSteps);
  const pasajerosHref = "/panel/pasajeros?from=mission";
  const pasajerosFocused = focusIs("pasajeros");
  const pasajerosStrip = guestMissionStripProps(guestMissionSteps);

  // Aterrizaje (misma franja de misión que Viaje e Invitados: descargar fotos en ZIP)
  const recuerdosStripProps = isPaid
    ? {
        ...getRecuerdosFotosMissionStrip(recuerdosDescargaHecha),
        ariaLabel: "Misión de recuerdos: descargar fotos",
      }
    : undefined;
  const experienciaDescription = isPaid
    ? recuerdosMisionDescription(recuerdosDescargaHecha)
    : "Cierre y recuerdos ✨";
  const experienciaCta = isPaid
    ? recuerdosMisionCtaLabel(recuerdosDescargaHecha)
    : "Definir aterrizaje";

  type MissionStatus = "empty" | "in_progress" | "completed" | "locked";

  const eventoMissionStatus: MissionStatus = eventoComplete ? "completed" : "empty";
  const pasajerosMissionStatus: MissionStatus = invitadosMissionDone
    ? "completed"
    : !guestMissionSteps.invitados_lista
      ? "empty"
      : "in_progress";
  const experienciaMissionStatus: MissionStatus = !isPaid
    ? "locked"
    : recuerdosDescargaHecha
      ? "completed"
      : "in_progress";

  /** Orden fijo en pantalla: Viaje → Pasajeros → Aterrizaje (sin reordenar por estado). */
  const phaseBase = getPhaseBaseOrder(phase);

  const viajeStrip = getViajeMissionStripFromSteps(journeySteps);
  const pasajerosStripProps = {
    steps: pasajerosStrip.steps,
    doneCount: pasajerosStrip.doneCount,
    totalCount: pasajerosStrip.totalCount,
    ariaLabel: "Misiones de invitados",
  };

  type CardSpec = {
    key: JourneyCardKey;
    status: MissionStatus;
    node: ReactNode;
  };

  const cards: CardSpec[] = [
    {
      key: "evento",
      status: eventoMissionStatus,
      node: (
        <JourneyCard
          key="evento"
          title="Viaje"
          description={eventoDescription}
          icon={<Plane className="text-white/85" strokeWidth={1.65} aria-hidden />}
          status={eventoCardStatus}
          href="/panel/viaje?from=mission"
          phaseHighlight={phaseFocusEvento || focusIs("evento")}
          ctaLabel={eventoCta}
          pulse={focusIs("evento")}
          missionStrip={viajeStrip}
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
      node: (
        <JourneyCard
          key="pasajeros"
          title="Invitados"
          description={pasajerosDescription}
          icon={<Users className="text-white/85" strokeWidth={1.65} aria-hidden />}
          status={pasajerosCardStatus}
          href={pasajerosHref}
          phaseHighlight={phaseFocusPasajeros || pasajerosFocused}
          ctaLabel={pasajerosCta}
          pulse={pasajerosFocused}
          missionStrip={pasajerosStripProps}
          onNavigate={() =>
            trackEvent("panel_mission_cta_clicked", {
              target: "invitados",
              state: invitadosMissionDone ? "completed" : "in_progress",
            })
          }
        />
      ),
    },
    {
      key: "experiencia",
      status: experienciaMissionStatus,
      node: (
        <JourneyCard
          key="experiencia"
          title="Aterrizaje"
          description={experienciaDescription}
          icon={<span aria-hidden>✨</span>}
          status={!isPaid ? "locked" : recuerdosDescargaHecha ? "completed" : "active"}
          href={isPaid ? "/panel/recuerdos?from=mission" : undefined}
          phaseHighlight={phaseFocusExperiencia || focusIs("experiencia")}
          ctaLabel={isPaid ? experienciaCta : undefined}
          pulse={isPaid && !recuerdosDescargaHecha && focusIs("experiencia")}
          missionStrip={recuerdosStripProps}
          onNavigate={
            isPaid
              ? () =>
                  trackEvent("panel_mission_cta_clicked", {
                    target: "experiencia",
                    state: recuerdosDescargaHecha ? "completed" : "in_progress",
                  })
              : undefined
          }
        />
      ),
    },
  ];

  const ordered = [...cards].sort((a, b) => phaseBase[a.key] - phaseBase[b.key]);
  const topActionable = ordered.find((c) => c.status === "empty" || c.status === "in_progress");

  const orderKeys = ordered.map((c) => c.key).join("|");

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
        <div className="mt-2 grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 sm:gap-3 md:mt-4 md:gap-4">
          {ordered.map((c) => c.node)}
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
      return "Invitados";
    case "experiencia":
      return "Aterrizaje";
  }
}
