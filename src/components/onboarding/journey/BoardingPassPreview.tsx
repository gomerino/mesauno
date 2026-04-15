"use client";

import { SoftAviationTicket } from "@/components/themes/soft-aviation/SoftAviationTicket";
import type { OnboardingJourneyState } from "@/lib/onboarding-journey";
import { buildPreviewModels } from "@/lib/onboarding-journey";
import type { EventoProgramaHito } from "@/types/database";

type Props = {
  state: OnboardingJourneyState;
  className?: string;
};

const EMPTY_HITOS: EventoProgramaHito[] = [];

/**
 * Vista previa boarding pass (tema Soft Aviation) a partir del estado del journey.
 */
export function BoardingPassPreview({ state, className = "" }: Props) {
  const { evento, invitado, merged, mapUrl } = buildPreviewModels(state);
  const dress = state.dress_code?.trim() || "Elegante";

  return (
    <div className={`relative ${className}`.trim()}>
      <div className="rounded-2xl bg-invite-sand p-3 sm:p-4">
        <SoftAviationTicket
          invitado={invitado}
          evento={evento}
          merged={merged}
          mapUrl={mapUrl}
          programaHitos={EMPTY_HITOS}
          dressCodeLabel={dress}
        />
      </div>
    </div>
  );
}
