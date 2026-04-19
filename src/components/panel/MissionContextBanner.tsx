"use client";

import { MissionBannerBase } from "@/components/panel/MissionBannerBase";
import { trackEvent } from "@/lib/analytics";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export type MissionKey = "evento" | "invitados" | "programa" | "experiencia";

type Props = {
  /** Se activa cuando la URL trae `?from=mission`. */
  fromMission: boolean;
  /** Identifica la misión para tracking y retorno con `?focus=...`. */
  missionKey: MissionKey;
  /** Título del banner (ej. "Misión Evento"). */
  title: string;
  /** Mensaje contextual corto (qué completar acá). */
  message: string;
  /** Override del `focus` con el que se vuelve al panel. Por defecto usa `missionKey`. */
  focusOnReturn?: MissionKey;
};

/**
 * Banner + botón "Volver al panel" para sub-pantallas del panel.
 * Generaliza el patrón ya usado en `/panel/invitados` para evento/programa/experiencia.
 */
export function MissionContextBanner({ fromMission, missionKey, title, message, focusOnReturn }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!fromMission) return;
    trackEvent("mission_page_viewed", { target: missionKey, from_mission: true });
  }, [fromMission, missionKey]);

  if (!fromMission) return null;

  const focus = focusOnReturn ?? missionKey;

  return (
    <MissionBannerBase
      title={title}
      message={message}
      action={
        <button
          type="button"
          onClick={() => {
            trackEvent("mission_back_to_panel", { target: missionKey });
            router.push(`/panel?focus=${focus}&t=${Date.now()}`);
          }}
          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
        >
          ← Volver al panel
        </button>
      }
    />
  );
}
