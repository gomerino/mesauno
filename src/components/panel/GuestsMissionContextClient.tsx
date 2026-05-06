"use client";

import { MissionBannerBase } from "@/components/panel/MissionBannerBase";
import { panelCtaJurnexPrimary } from "@/components/panel/ds";
import { trackEvent } from "@/lib/analytics";
import { guestMissionCtaLabel, type GuestMissionState } from "@/lib/guest-mission";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  fromMission: boolean;
  missionState: GuestMissionState;
};

export function GuestsMissionContextClient({ fromMission, missionState }: Props) {
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
      title="Misión Pasajeros"
      message={message}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="#agregar-invitados"
            className={panelCtaJurnexPrimary + " items-center gap-1 px-4 py-2.5 text-xs"}
          >
            {guestMissionCtaLabel(missionState)}
          </a>
          <button
            type="button"
            onClick={() => {
              trackEvent("mission_back_to_panel", { target: "invitados" });
              router.push(`/panel?focus=invitados&t=${Date.now()}`);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-invite-gold/30 bg-white/[0.05] px-4 py-2.5 text-xs font-medium text-slate-200 transition hover:border-invite-gold/45 hover:bg-white/10 hover:text-white"
          >
            ← Volver al panel
          </button>
        </div>
      }
    />
  );
}
