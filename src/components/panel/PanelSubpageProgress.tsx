import { PanelSlimProgress } from "@/components/panel/PanelSlimProgress";
import { journeyHeadline, loadPanelProgressBundle } from "@/lib/panel-progress-load";
import { createClient } from "@/lib/supabase/server";

/**
 * Barra de progreso slim para subpáginas del panel.
 * Va directamente debajo del `PanelPageHeader` para mantener la misma
 * posición en mobile y desktop.
 */
export async function PanelSubpageProgress() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { pct, nextStep, remainingSteps } = await loadPanelProgressBundle(user.id);
  const headline = journeyHeadline(nextStep, remainingSteps);

  return (
    <div className="mt-4 md:mt-6">
      <PanelSlimProgress pct={pct} headline={headline} nextStep={nextStep} />
    </div>
  );
}
