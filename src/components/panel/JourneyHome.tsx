import { JourneyViajeClient } from "@/components/panel/JourneyViajeClient";
import { JourneyPrimaryCta } from "@/components/panel/journey/JourneyPrimaryCta";
import { PanelInviteShareCard } from "@/components/panel/PanelInviteShareCard";
import { PanelSlimProgress } from "@/components/panel/PanelSlimProgress";
import { JourneyPhasesBar } from "@/components/panel/journey/JourneyPhasesBar";
import { resolveGuestMissionState } from "@/lib/guest-mission";
import { resolveInvitationToken } from "@/lib/invitation-url";
import { getJourneyPhasesProgressLines } from "@/lib/journey-cards-progress";
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
  focusTarget?: string | null;
};

function isPlanActive(status: string | null | undefined): boolean {
  return status === "paid";
}

export async function JourneyHome({
  forceFresh = false,
  showSuccessHero = false,
  optimisticPlanActive = false,
  optimisticPaymentStatus = null,
  focusTarget = null,
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

  const bundle = await loadPanelProgressBundle(user.id);
  const invitacionesEnviadas = bundle.invitados.filter((r) => r.email_enviado === true).length;
  const planStatus = optimisticPlanActive ? "paid" : bundle.evento?.plan_status ?? null;
  const paymentStatus = optimisticPaymentStatus ?? bundle.mockPaymentStatus;
  const hasAccess = planStatus === "paid";
  const journeyPhase = resolveJourneyPhase(bundle.evento?.fecha_boda, bundle.evento?.fecha_evento);
  const invitadosMission = resolveGuestMissionState(bundle.invitados);
  const planPaidForProgress = optimisticPlanActive || bundle.evento?.plan_status === "paid";
  const journeyProgress = getJourneyPhasesProgressLines(bundle, { planPaid: planPaidForProgress });

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

  const sampleInvitado = bundle.invitados.find((i) => {
    const raw = i.token_acceso?.trim();
    return raw && raw.length > 0;
  }) ?? bundle.invitados[0] ?? null;
  const sampleToken = sampleInvitado
    ? resolveInvitationToken({
        token_acceso: sampleInvitado.token_acceso ?? null,
        id: sampleInvitado.id,
      })
    : null;
  const sampleNombre = sampleInvitado?.nombre_pasajero?.trim() || null;

  return (
    <div className="mx-auto w-full max-w-4xl">
      {bundle.evento ? (
        <>
          {/* Above the fold: CTA + fases del viaje */}
          <div className="flex min-h-[13.5rem] flex-col gap-3 md:min-h-[15rem] md:gap-4">
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
            <JourneyPhasesBar
              phase={journeyPhase}
              className={hasAccess ? "mt-1.5 md:mt-2" : ""}
              progressPrimary={journeyProgress.primary}
              progressHint={journeyProgress.hint}
            />
          </div>

          {/* Below the fold: PanelSlimProgress en móvil solo si falta completar el journey; luego cards */}
          <div className="mt-3 flex flex-col gap-3 border-t border-white/[0.06] pt-3 md:mt-6 md:gap-4 md:pt-6">
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
            {bundle.invitados.length > 0 ? (
              <PanelInviteShareCard
                sampleToken={sampleToken}
                sampleNombre={sampleNombre}
                invitadosCount={bundle.invitados.length}
                invitacionesEnviadas={invitacionesEnviadas}
              />
            ) : null}
            <JourneyViajeClient
              evento={bundle.evento}
              phase={journeyPhase}
              invitadosMission={invitadosMission}
              focusTarget={focusTarget}
              eventoComplete={bundle.steps.evento}
              programaHitosCount={bundle.programaHitosCount}
            />
          </div>
        </>
      ) : (
        <div className="flex min-h-[13.5rem] flex-col gap-3 md:min-h-[15rem] md:gap-4">
          <JourneyPhasesBar
            phase={journeyPhase}
            progressPrimary={journeyProgress.primary}
            progressHint={journeyProgress.hint}
          />
          <JourneyViajeClient
            evento={bundle.evento}
            phase={journeyPhase}
            invitadosMission={invitadosMission}
            focusTarget={focusTarget}
            eventoComplete={bundle.steps.evento}
            programaHitosCount={bundle.programaHitosCount}
          />
        </div>
      )}
    </div>
  );
}
