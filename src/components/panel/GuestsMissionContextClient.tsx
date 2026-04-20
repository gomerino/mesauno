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
      ? "Añade tu primera persona para iniciar el check-in."
      : missionState === "in_progress"
        ? "Vas muy bien. Completa la lista o comparte para marcar la misión cumplida."
        : "Excelente: misión invitados completada.";

  return (
    <MissionBannerBase
      variant="premium"
      title="Misión Invitados"
      message={message}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="#agregar-invitados"
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-teal-500 to-teal-400 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-teal-950/25 transition hover:brightness-110"
          >
            {hasInvitados ? "Continuar invitados" : "Agregar invitados"}
          </a>
          <button
            type="button"
            onClick={() => {
              trackEvent("mission_back_to_panel", { target: "invitados" });
              router.push(`/panel?focus=invitados&t=${Date.now()}`);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/30 bg-white/[0.05] px-4 py-2.5 text-xs font-medium text-slate-200 transition hover:border-[#D4AF37]/45 hover:bg-white/10 hover:text-white"
          >
            ← Volver al panel
          </button>
        </div>
      }
    />
  );
}
