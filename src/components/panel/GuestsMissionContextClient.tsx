"use client";

import { MissionBannerBase } from "@/components/panel/MissionBannerBase";
import { trackEvent } from "@/lib/analytics";
import type { GuestMissionState } from "@/lib/guest-mission";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  fromMission: boolean;
  missionState: GuestMissionState;
  hasInvitados: boolean;
};

export function GuestsMissionContextClient({ fromMission, missionState, hasInvitados }: Props) {
  const router = useRouter();

  useEffect(() => {
    trackEvent("guests_page_viewed", { from_mission: fromMission });
  }, [fromMission]);

  if (!fromMission) return null;

  const message =
    missionState === "empty"
      ? "Agregá tu primera persona para iniciar el check-in."
      : missionState === "in_progress"
        ? "Vas muy bien. Completá o compartí para marcar misión cumplida."
        : "Excelente: misión invitados completada.";

  return (
    <MissionBannerBase
      title="Misión Invitados"
      message={message}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="#agregar-invitados"
            className="inline-flex items-center gap-1 rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-400"
          >
            {hasInvitados ? "Continuar invitados" : "Agregar invitados"}
          </a>
          <button
            type="button"
            onClick={() => {
              trackEvent("mission_back_to_panel", { target: "invitados" });
              router.push(`/panel?focus=invitados&t=${Date.now()}`);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
          >
            ← Volver al panel
          </button>
        </div>
      }
    />
  );
}
