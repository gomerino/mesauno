"use client";

import { JourneyMissionStrip } from "@/components/panel/journey/JourneyMissionStrip";
import { PanelMissionCard } from "@/components/panel/PanelMissionCard";
import {
  getRecuerdosFotosMissionStrip,
  hasRecuerdosFotosDownloadMisionDone,
  recuerdosMisionDescription,
  RECUERDOS_MISSION_EVENT,
  recuerdosMissionStorageKey,
} from "@/lib/recuerdos-mission";
import { useEffect, useState } from "react";

type Props = { eventoId: string };

/**
 * Misma lógica que la franja de la card Aterrizaje en el home: paso «Descargar»,
 * completado al bajar al menos un ZIP (localStorage + evento en misma pestaña).
 */
export function RecuerdosMisionBlock({ eventoId }: Props) {
  const [descargaHecha, setDescargaHecha] = useState(false);

  useEffect(() => {
    setDescargaHecha(hasRecuerdosFotosDownloadMisionDone(eventoId));
    const onCustom = (e: Event) => {
      const d = (e as CustomEvent<{ eventoId?: string }>).detail;
      if (d?.eventoId === eventoId) setDescargaHecha(true);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === recuerdosMissionStorageKey(eventoId) && e.newValue === "1") {
        setDescargaHecha(true);
      }
    };
    window.addEventListener(RECUERDOS_MISSION_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(RECUERDOS_MISSION_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [eventoId]);

  const strip = getRecuerdosFotosMissionStrip(descargaHecha);

  return (
    <div>
      <PanelMissionCard
        micro={recuerdosMisionDescription(descargaHecha)}
        missionStrip={
          <JourneyMissionStrip
            noTopRule
            hideMisionesLabel
            compact
            steps={strip.steps}
            doneCount={strip.doneCount}
            totalCount={strip.totalCount}
            ariaLabel={strip.ariaLabel ?? "Misión de recuerdos"}
          />
        }
      />
    </div>
  );
}
