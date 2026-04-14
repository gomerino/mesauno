import { PanelSlimProgress } from "@/components/panel/PanelSlimProgress";
import { loadPanelProgressBundle } from "@/lib/panel-progress-load";
import { createClient } from "@/lib/supabase/server";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/** Barra de progreso + nudge en subpáginas del panel (no en Inicio). */
export async function PanelSubpageChrome({ children }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return <>{children}</>;
  }

  const { pct, steps } = await loadPanelProgressBundle(supabase, user.id);

  return (
    <>
      <div className="mb-8 hidden md:block">
        <PanelSlimProgress pct={pct} steps={steps} />
      </div>
      {children}
      <div className="mt-8 md:hidden">
        <PanelSlimProgress pct={pct} steps={steps} variant="compact" />
      </div>
    </>
  );
}
