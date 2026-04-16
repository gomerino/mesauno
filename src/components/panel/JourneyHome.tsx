import { JourneyViajeClient } from "@/components/panel/JourneyViajeClient";
import { JourneyPrimaryCta } from "@/components/panel/journey/JourneyPrimaryCta";
import { PanelSlimProgress } from "@/components/panel/PanelSlimProgress";
import { PanelThemeSelector } from "@/components/panel/PanelThemeSelector";
import { JourneyPhasesBar } from "@/components/panel/journey/JourneyPhasesBar";
import { journeyHeadline, loadPanelProgressBundle } from "@/lib/panel-progress-load";
import { resolveJourneyPhase } from "@/lib/journey-phases";
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

type JourneyHomeProps = {
  /** Fuerza refresco del bundle (ej. retorno post-pago con `?welcome=1`). */
  forceFresh?: boolean;
  /** Feedback post-pago visible una sola vez cuando llega `?welcome=1`. */
  showSuccessHero?: boolean;
  /** UX optimista para evitar flicker al simular approved por query param. */
  optimisticPlanActive?: boolean;
  /** Estado mock optimista desde query param (dev). */
  optimisticPaymentStatus?: "approved" | "rejected" | "pending" | null;
};

function isPlanActive(status: string | null | undefined): boolean {
  return status === "paid";
}

export async function JourneyHome({
  forceFresh = false,
  showSuccessHero = false,
  optimisticPlanActive = false,
  optimisticPaymentStatus = null,
}: JourneyHomeProps) {
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
  const planStatus = optimisticPlanActive ? "paid" : bundle.evento?.plan_status ?? null;
  const paymentStatus = optimisticPaymentStatus ?? bundle.mockPaymentStatus;
  const hasAccess = planStatus === "paid";
  const journeyPhase = resolveJourneyPhase(bundle.evento?.fecha_boda, bundle.evento?.fecha_evento);

  let canCheckout = false;
  let prefillNombre = "";
  if (bundle.evento?.id) {
    const { data: isAdmin } = await supabase.rpc("user_is_evento_admin", { p_evento_id: bundle.evento.id });
    const ps = optimisticPlanActive ? "paid" : bundle.evento.plan_status ?? "trial";
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
          <div className="flex flex-col gap-8 md:gap-10">
            {(!hasAccess || showSuccessHero) && (
              <JourneyPrimaryCta
                invitados_count={bundle.invitados.length}
                plan_status={planStatus}
                payment_status={paymentStatus}
                invitaciones_enviadas={invitacionesEnviadas}
                canCheckout={canCheckout}
                eventoId={bundle.evento.id}
                userEmail={user.email ?? ""}
                prefillNombre={prefillNombre || "Mi evento"}
                phase={journeyPhase}
              />
            )}
            {hasAccess ? (
              <p className="text-xs font-medium tracking-wide text-[#D4AF37]/85">
                ✨ Experiencia activa
              </p>
            ) : null}
            <JourneyPhasesBar phase={journeyPhase} className="mt-1" />
            <div className="mt-6">
              <PanelThemeSelector />
            </div>
          </div>

          {/* Below the fold: progreso y módulos */}
          <div className="mt-10 flex flex-col gap-8 border-t border-white/[0.06] pt-10 md:mt-12 md:gap-10 md:pt-12">
            <div className="md:hidden">
              <PanelSlimProgress
                pct={bundle.pct}
                headline={journeyHeadline(bundle.nextStep, bundle.remainingSteps)}
                nextStep={bundle.nextStep}
                footer="none"
              />
            </div>
            <JourneyViajeClient
              evento={bundle.evento}
              invitadosCount={bundle.invitados.length}
              phase={journeyPhase}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-8 md:gap-10">
          <JourneyPhasesBar phase={journeyPhase} />
          <div className="mt-2">
            <PanelThemeSelector />
          </div>
          <JourneyViajeClient
            evento={bundle.evento}
            invitadosCount={bundle.invitados.length}
            phase={journeyPhase}
          />
        </div>
      )}
    </>
  );
}
