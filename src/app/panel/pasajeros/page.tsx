import { GrowthNudge } from "@/components/app/GrowthNudge";
import { PanelLayout } from "@/components/panel/ds";
import { PasajerosPage } from "@/components/panel/pasajeros/PasajerosPage";
import { createClient } from "@/lib/supabase/server";
import { panelJourneyPageWrapClass } from "@/lib/panel-section-copy";
import { fetchInvitadosPanelRowsWithAcompanantes } from "@/lib/panel-invitados";
import { loadPanelProgressBundle } from "@/lib/panel-progress-load";
import { eventoTienePlanPagado } from "@/lib/evento-plan-access";
import { parseMetricaFiltroFromSearch } from "@/lib/invitado-metrica-url";
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
  const metricaRaw = searchParams?.metrica;
  const metricaFiltro = parseMetricaFiltroFromSearch(
    typeof metricaRaw === "string" ? metricaRaw : Array.isArray(metricaRaw) ? metricaRaw[0] : undefined
  );
  const planPagado = eventoTienePlanPagado(evento);

  return (
    <PanelLayout>
      <div className={panelJourneyPageWrapClass}>
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
            planPagado={planPagado}
            initialInvitados={invitados}
            fromMission={fromMission}
            metricaFiltro={metricaFiltro}
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
