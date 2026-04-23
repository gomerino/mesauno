import { EventoCentroTabProvider } from "@/components/panel/evento/EventoCentroTabContext";
import { EventoConfigCompleteNote, EventoConfigPrimaryCta } from "@/components/panel/evento/EventoConfigPrimaryCta";
import { EventoMobileStickyCta } from "@/components/panel/evento/EventoMobileStickyCta";
import { EventoTabs } from "@/components/panel/evento/EventoTabs";
import { ViajeMisionBlock } from "@/components/panel/viaje/ViajeMisionBlock";
import { PanelLayout } from "@/components/panel/ds";
import { JourneyPrimaryCta } from "@/components/panel/journey/JourneyPrimaryCta";
import { EventoForm } from "@/components/panel/EventoForm";
import {
  PANEL_VIAJE_SUBTITLE,
  PANEL_VIAJE_TITLE,
  panelJourneyPageWrapClass,
  panelSectionSubtitleClass,
  panelSectionTitleClass,
} from "@/lib/panel-section-copy";
import { getEventoConfigCTA } from "@/lib/evento-config-cta";
import { selectEventoForMember } from "@/lib/evento-membership";
import { resolveJourneyPhase } from "@/lib/journey-phases";
import { isEventBasicsComplete } from "@/lib/panel-setup-progress";
import { getViajeMisionMicroFromBundle } from "@/lib/viaje-mission";
import { loadPanelProgressBundle } from "@/lib/panel-progress-load";
import { spotifyGetPanelPublicState } from "@/lib/spotify-credentials";
import { createClient, createStrictServiceClient } from "@/lib/supabase/server";
import type { ConfiguracionInvitacionEvento, Evento } from "@/types/database";

function pickWelcome(raw: Record<string, string | string[] | undefined> | undefined): boolean {
  if (!raw) return false;
  const v = raw.welcome;
  const s = typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
  return s === "1" || s === "true";
}

export default async function PanelViajePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const showWelcomeBanner = pickWelcome(searchParams);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: evento } = await selectEventoForMember(supabase, user!.id, "*");
  const bundle = await loadPanelProgressBundle(user!.id);

  const eventoForProgress = (evento ?? null) as Evento | null;
  const basicsDone = isEventBasicsComplete(eventoForProgress);
  const journeyPhase = resolveJourneyPhase(eventoForProgress?.fecha_boda, eventoForProgress?.fecha_evento);

  const invitadosCount = bundle.invitados.length;
  const invitacionesEnviadas = bundle.invitados.filter((r) => r.email_enviado === true).length;
  const planStatus = eventoForProgress?.plan_status ?? null;
  const hasAccess = planStatus === "paid";
  let canCheckout = false;
  let prefillNombre = "";
  let isAdmin = false;
  if (eventoForProgress?.id) {
    const { data: admin } = await supabase.rpc("user_is_evento_admin", { p_evento_id: eventoForProgress.id });
    isAdmin = Boolean(admin);
    canCheckout = planStatus !== "paid" && isAdmin;
    const n1 = eventoForProgress.nombre_novio_1?.trim() ?? "";
    const n2 = eventoForProgress.nombre_novio_2?.trim() ?? "";
    prefillNombre = [n1, n2].filter(Boolean).join(" & ");
  }

  const eventoId = eventoForProgress?.id ?? null;

  let configuracionInvitacion: ConfiguracionInvitacionEvento | null = null;
  if (eventoId) {
    const { data: cfgInv } = await supabase
      .from("configuracion_invitacion_evento")
      .select("*")
      .eq("evento_id", eventoId)
      .maybeSingle();
    configuracionInvitacion = (cfgInv ?? null) as ConfiguracionInvitacionEvento | null;
  }

  const strictDb = await createStrictServiceClient();
  let spotifyState = { connected: false as boolean, playlistId: null as string | null };
  if (strictDb && eventoId && isAdmin && hasAccess) {
    spotifyState = await spotifyGetPanelPublicState(strictDb, eventoId);
  }

  const spotifySectionAvailable = Boolean(strictDb && eventoId && isAdmin && hasAccess);

  const configCta = getEventoConfigCTA({
    evento: eventoForProgress,
    bundle: {
      programaHitosCount: bundle.programaHitosCount,
      steps: bundle.steps,
    },
    hasAccess,
    isAdmin,
    spotifyConnected: spotifyState.connected,
    spotifySectionAvailable,
  });

  const mainBottomPad =
    hasAccess && configCta.status === "pending" ? "pb-28 md:pb-4" : "pb-4 md:pb-4";

  return (
    <PanelLayout>
      <div className={panelJourneyPageWrapClass}>
        {showWelcomeBanner ? (
          <div
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80"
            role="status"
          >
            <span className="font-medium text-white">¡Bienvenidos!</span> Completá los datos para seguir preparando tu
            viaje.
          </div>
        ) : null}

        {!hasAccess ? (
          <div className="mb-4">
          <JourneyPrimaryCta
            invitados_count={invitadosCount}
            plan_status={planStatus}
            payment_status={bundle.mockPaymentStatus}
            invitaciones_enviadas={invitacionesEnviadas}
            canCheckout={canCheckout}
            eventoId={eventoForProgress?.id ?? null}
            userEmail={user?.email ?? ""}
            prefillNombre={prefillNombre || "Mi evento"}
            phase={journeyPhase}
          />
          </div>
        ) : null}

        <EventoCentroTabProvider>
          <div className={`space-y-4 md:space-y-5 ${mainBottomPad}`}>
            <header className="space-y-1">
              <h1 className={panelSectionTitleClass}>{PANEL_VIAJE_TITLE}</h1>
              <p className={panelSectionSubtitleClass}>{PANEL_VIAJE_SUBTITLE}</p>
            </header>

            {eventoId ? (
              <ViajeMisionBlock
                micro={getViajeMisionMicroFromBundle(bundle)}
                journeySteps={bundle.steps}
              />
            ) : null}

            {hasAccess && configCta.status === "pending" ? (
              <div className="hidden md:block">
                <EventoConfigPrimaryCta result={configCta} />
              </div>
            ) : null}

            {hasAccess && configCta.status === "complete" ? <EventoConfigCompleteNote /> : null}

            {!basicsDone ? (
              <p className="text-[11px] text-white/50" role="status">
                Falta: nombres de ambos y fecha para la información básica.
              </p>
            ) : null}

            <EventoTabs />

            <div className="scroll-mt-20 pt-0.5" id="musica-spotify">
              <EventoForm
                initial={(evento ?? null) as Evento | null}
                programaHitosCount={bundle.programaHitosCount}
                configuracionInvitacion={configuracionInvitacion}
                spotify={
                  hasAccess && isAdmin && eventoId
                    ? {
                        eventoId,
                        connected: spotifyState.connected,
                        playlistId: spotifyState.playlistId,
                        strictDb: Boolean(strictDb),
                      }
                    : null
                }
              />
            </div>

            {hasAccess ? <EventoMobileStickyCta result={configCta} /> : null}
          </div>
        </EventoCentroTabProvider>
      </div>
    </PanelLayout>
  );
}
