import { JourneyViajeClient } from "@/components/panel/JourneyViajeClient";
import { JourneyPrimaryCta } from "@/components/panel/journey/JourneyPrimaryCta";
import { PanelSlimProgress } from "@/components/panel/PanelSlimProgress";
import { PanelThemeSelector } from "@/components/panel/PanelThemeSelector";
import { journeyHeadline, loadPanelProgressBundle } from "@/lib/panel-progress-load";
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

type JourneyHomeProps = {
  /** Fuerza refresco del bundle (ej. retorno post-pago con `?welcome=1`). */
  forceFresh?: boolean;
};

function isPlanActive(status: string | null | undefined): boolean {
  return status === "paid" || status === "active";
}

export async function JourneyHome({ forceFresh = false }: JourneyHomeProps) {
  if (forceFresh) {
    noStore();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const bundle = await loadPanelProgressBundle(supabase, user.id);
  const invitacionesEnviadas = bundle.invitados.filter((r) => r.email_enviado === true).length;
  const planStatus = bundle.evento?.plan_status ?? null;

  let canCheckout = false;
  let prefillNombre = "";
  if (bundle.evento?.id) {
    const { data: isAdmin } = await supabase.rpc("user_is_evento_admin", { p_evento_id: bundle.evento.id });
    const ps = bundle.evento.plan_status ?? "trial";
    canCheckout = !isPlanActive(ps) && Boolean(isAdmin);
    const n1 = bundle.evento.nombre_novio_1?.trim() ?? "";
    const n2 = bundle.evento.nombre_novio_2?.trim() ?? "";
    prefillNombre = [n1, n2].filter(Boolean).join(" & ");
  }

  return (
    <>
      {bundle.evento ? (
        <>
          {/* Above the fold: un solo foco (CTA) + selector de estilo secundario */}
          <div className="flex flex-col gap-8">
            <JourneyPrimaryCta
              invitados_count={bundle.invitados.length}
              plan_status={planStatus}
              invitaciones_enviadas={invitacionesEnviadas}
              canCheckout={canCheckout}
              eventoId={bundle.evento.id}
              userEmail={user.email ?? ""}
              prefillNombre={prefillNombre || "Mi evento"}
            />
            <PanelThemeSelector />
          </div>

          {/* Below the fold: progreso y módulos */}
          <div className="mt-8 flex flex-col gap-8 border-t border-white/[0.06] pt-8 md:mt-10 md:pt-10">
            <PanelSlimProgress
              pct={bundle.pct}
              headline={journeyHeadline(bundle.nextStep, bundle.remainingSteps)}
              nextStep={bundle.nextStep}
              footer="none"
            />
            <JourneyViajeClient evento={bundle.evento} invitadosCount={bundle.invitados.length} />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-8">
          <PanelThemeSelector />
          <JourneyViajeClient evento={bundle.evento} invitadosCount={bundle.invitados.length} />
        </div>
      )}
    </>
  );
}
