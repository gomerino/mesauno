"use client";

import { JourneyMissionStrip } from "@/components/panel/journey/JourneyMissionStrip";
import { PanelMissionCard } from "@/components/panel/PanelMissionCard";
import { getViajeMissionStripFromSteps } from "@/lib/viaje-mission";
import type { JourneyStepId } from "@/lib/panel-setup-progress";

type Props = {
  /** Micro: calcular en servidor con `getViajeMisionMicroFromBundle(bundle)`. */
  micro: string;
  journeySteps: Record<JourneyStepId, boolean>;
};

/**
 * Franja de las 4 misiones de configuración del viaje, mismo formato que Pasajeros / Recuerdos.
 */
export function ViajeMisionBlock({ micro, journeySteps }: Props) {
  const viajeStrip = getViajeMissionStripFromSteps(journeySteps);

  return (
    <PanelMissionCard
      micro={micro}
      missionStrip={
        <JourneyMissionStrip
          noTopRule
          hideMisionesLabel
          compact
          {...viajeStrip}
          ariaLabel="Misiones de viaje: datos, lugar, programa, música"
        />
      }
    />
  );
}
