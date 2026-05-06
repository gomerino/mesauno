import { PanelLayout } from "@/components/panel/ds";
import { JourneyPrimaryCta } from "@/components/panel/journey/JourneyPrimaryCta";
import { JourneyPanelMetricsBlock } from "@/components/panel/journey/JourneyPanelMetricsBlock";
import { JourneyViajeClient } from "@/components/panel/JourneyViajeClient";
import { PanelInviteHero } from "@/components/panel/PanelInviteHero";
import { PanelSlimProgress } from "@/components/panel/PanelSlimProgress";
import { formatFechaEventoLarga } from "@/lib/format-fecha-evento";
import { getGuestMissionSteps } from "@/lib/guest-mission";
import { getInvitacionesRsvpResumen } from "@/lib/invitaciones-metricas";
import { eventoTienePlanExperienciaProducto, eventoTienePlanPagado } from "@/lib/evento-plan-access";
import { journeyHeadline, loadPanelProgressBundle } from "@/lib/panel-progress-load";
import { panelJourneyContentWidthClass } from "@/lib/panel-section-copy";
import { JOURNEY_STEP_ORDER } from "@/lib/panel-setup-progress";
import { resolveJourneyPhase } from "@/lib/journey-phases";
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { Suspense } from "react";

type JourneyHomeProps = {
  focusTarget?: string | null;
};

export async function JourneyHome({ focusTarget = null }: JourneyHomeProps) {
  noStore();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const bundle = await loadPanelProgressBundle(user.id);
  const eventoConfigComplete = JOURNEY_STEP_ORDER.every((id) => bundle.steps[id]);
  const journeyPhase = resolveJourneyPhase(bundle.evento?.fecha_boda, bundle.evento?.fecha_evento);
  const guestMissionSteps = getGuestMissionSteps(bundle.invitados);

  const ev = bundle.evento;
  const fechaEventoParaHero = ev?.fecha_evento ?? ev?.fecha_boda ?? null;
  const fechaLegibleHero = formatFechaEventoLarga(fechaEventoParaHero);
  const horaEmbarqueHero = (ev?.hora_embarque ?? "16:00").trim() || "16:00";
  const tituloNoviosHero =
    [ev?.nombre_novio_1, ev?.nombre_novio_2].filter((n) => n?.trim()).join(" & ") || "Nuestra boda";

  const metrics = getInvitacionesRsvpResumen(bundle.invitados);

  const faltaActivarPlan = Boolean(ev && !eventoTienePlanPagado(ev));
  let canCheckoutHero = false;
  if (ev?.id && faltaActivarPlan) {
    const { data: isAdmin } = await supabase.rpc("user_is_evento_admin", { p_evento_id: ev.id });
    canCheckoutHero = Boolean(isAdmin) && !eventoTienePlanExperienciaProducto(ev);
  }
  const invitacionesEnviadas = bundle.invitados.filter((r) => r.email_enviado === true).length;
  const prefillNombreHero =
    [ev?.nombre_novio_1?.trim(), ev?.nombre_novio_2?.trim()].filter(Boolean).join(" & ") || "Mi evento";

  return (
    <PanelLayout>
      {bundle.evento ? (
        <div className={`${panelJourneyContentWidthClass} flex flex-col gap-2.5 md:gap-3`}>
          <PanelInviteHero
            tituloNovios={tituloNoviosHero}
            fechaEvento={fechaEventoParaHero}
            horaEmbarque={horaEmbarqueHero}
            fechaLegible={fechaLegibleHero}
          />
          {faltaActivarPlan ? (
            <JourneyPrimaryCta
              invitados_count={bundle.invitados.length}
              plan={ev?.plan ?? null}
              payment_status={bundle.mockPaymentStatus}
              invitaciones_enviadas={invitacionesEnviadas}
              canCheckout={canCheckoutHero}
              eventoId={ev?.id ?? null}
              userEmail={user.email ?? ""}
              prefillNombre={prefillNombreHero}
              phase={journeyPhase}
              canalEnvioInvitacion={bundle.canalEnvioInvitacion}
            />
          ) : null}
          <Suspense
            fallback={
              <div
                className="h-[7.5rem] w-full animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] md:h-[5.5rem]"
                aria-hidden
              />
            }
          >
            <JourneyPanelMetricsBlock
              totalInvitados={metrics.totalInvitados}
              confirmadas={metrics.confirmadas}
              noAsistire={metrics.noAsistire}
              pendienteConfirmar={metrics.pendienteConfirmar}
            />
          </Suspense>
          {bundle.pct < 100 ? (
            <div className="md:hidden">
              <PanelSlimProgress
                pct={bundle.pct}
                headline={journeyHeadline(bundle.nextStep, bundle.remainingSteps)}
                nextStep={bundle.nextStep}
                footer="none"
              />
            </div>
          ) : null}
          <JourneyViajeClient
            evento={bundle.evento}
            phase={journeyPhase}
            guestMissionSteps={guestMissionSteps}
            focusTarget={focusTarget}
            eventoComplete={eventoConfigComplete}
            journeySteps={bundle.steps}
          />
        </div>
      ) : (
        <div className={`${panelJourneyContentWidthClass} flex flex-col gap-2.5 md:gap-3`}>
          <JourneyViajeClient
            evento={bundle.evento}
            phase={journeyPhase}
            guestMissionSteps={guestMissionSteps}
            focusTarget={focusTarget}
            eventoComplete={eventoConfigComplete}
            journeySteps={bundle.steps}
          />
        </div>
      )}
    </PanelLayout>
  );
}
