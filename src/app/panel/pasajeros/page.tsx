import { GrowthNudge } from "@/components/app/GrowthNudge";
import { PanelLayout } from "@/components/panel/ds";
import { JourneyPrimaryCta } from "@/components/panel/journey/JourneyPrimaryCta";
import { PasajerosPage } from "@/components/panel/pasajeros/PasajerosPage";
import { createClient } from "@/lib/supabase/server";
import { panelJourneyPageWrapClass } from "@/lib/panel-section-copy";
import { fetchInvitadosPanelRowsWithAcompanantes } from "@/lib/panel-invitados";
import { resolveJourneyPhase } from "@/lib/journey-phases";
import { loadPanelProgressBundle } from "@/lib/panel-progress-load";
import type { Invitado } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function PanelInvitadosPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const bundle = await loadPanelProgressBundle(user!.id);
  const evento = bundle.evento;

  const { data, error: invitadosError } = await fetchInvitadosPanelRowsWithAcompanantes(
    supabase,
    user!.id,
    evento?.id ?? null,
    { orderBy: "created_at", ascending: false }
  );
  if (invitadosError) {
    console.error("[panel/invitados] fetch invitados:", invitadosError.message);
  }

  const invitados = (data ?? []) as unknown as Invitado[];
  const hasInvitados = invitados.length > 0;
  const fromMissionRaw = searchParams?.from;
  const fromMission =
    fromMissionRaw === "mission" ||
    (Array.isArray(fromMissionRaw) && fromMissionRaw.includes("mission"));
  const journeyPhase = resolveJourneyPhase(evento?.fecha_boda, evento?.fecha_evento);
  const planStatus = evento?.plan_status ?? null;
  const hasAccess = planStatus === "paid";
  const invitacionesEnviadas = invitados.filter((r) => r.email_enviado === true).length;
  let canCheckout = false;
  let prefillNombre = "";
  if (evento?.id) {
    const { data: isAdmin } = await supabase.rpc("user_is_evento_admin", { p_evento_id: evento.id });
    canCheckout = planStatus !== "paid" && Boolean(isAdmin);
    const n1 = evento.nombre_novio_1?.trim() ?? "";
    const n2 = evento.nombre_novio_2?.trim() ?? "";
    prefillNombre = [n1, n2].filter(Boolean).join(" & ");
  }

  return (
    <PanelLayout>
      <div className={panelJourneyPageWrapClass}>
        {!hasAccess ? (
        <div>
          <JourneyPrimaryCta
            invitados_count={invitados.length}
            plan_status={planStatus}
            payment_status={bundle.mockPaymentStatus}
            invitaciones_enviadas={invitacionesEnviadas}
            canCheckout={canCheckout}
            eventoId={evento?.id ?? null}
            userEmail={user?.email ?? ""}
            prefillNombre={prefillNombre || "Mi evento"}
            phase={journeyPhase}
          />
        </div>
      ) : null}

      {!evento && (
        <div>
          <GrowthNudge
            message="Aún no creaste la ficha del viaje. Cuando la completes, los invitados quedarán asociados automáticamente."
            href="/panel/viaje"
            ctaLabel="Crear ficha del viaje"
          />
        </div>
        )}

        {evento && !hasInvitados && (
        <div
          className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70"
          role="status"
        >
          <strong className="font-medium text-white/90">Te falta un paso:</strong> añade al menos una persona
          para generar su invitación y compartirla.
        </div>
        )}

        {invitadosError && (
        <p className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm text-red-200/90">
          No pudimos cargar la lista. Intenta recargar la página. Si el problema sigue, contacta soporte.
        </p>
        )}

        {!invitadosError ? (
        <div id="agregar-invitados" className="scroll-mt-24">
          <PasajerosPage
            eventoId={evento?.id ?? null}
            initialInvitados={invitados}
            fromMission={fromMission}
            eventoMeta={
              evento
                ? {
                    objetivo_invitaciones_enviar: evento.objetivo_invitaciones_enviar ?? null,
                    objetivo_personas_total: evento.objetivo_personas_total ?? null,
                  }
                : null
            }
          />
        </div>
        ) : null}
      </div>
    </PanelLayout>
  );
}
