import { GrowthNudge } from "@/components/app/GrowthNudge";
import { InvitadosManager } from "@/components/InvitadosManager";
import { JourneyPrimaryCta } from "@/components/panel/journey/JourneyPrimaryCta";
import { JourneyPhasesBar } from "@/components/panel/journey/JourneyPhasesBar";
import { InvitadosSidebar } from "@/components/panel/invitados/InvitadosSidebar";
import { PanelPageHeader } from "@/components/panel/PanelPageHeader";
import { createClient } from "@/lib/supabase/server";
import { fetchInvitadosPanelRowsWithAcompanantes } from "@/lib/panel-invitados";
import { resolveJourneyPhase } from "@/lib/journey-phases";
import { getJourneyPhasesProgressLines } from "@/lib/journey-cards-progress";
import { loadPanelProgressBundle } from "@/lib/panel-progress-load";
import type { Invitado } from "@/types/database";
import Link from "next/link";

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
  const journeyProgress = getJourneyPhasesProgressLines({
    ...bundle,
    invitados,
  });
  const planStatus = evento?.plan_status ?? null;
  const hasAccess = planStatus === "paid";
  const invitacionesEnviadas = invitados.filter((r) => r.email_enviado === true).length;
  const abrieronTrasCorreo = invitados.filter(
    (r) => r.email_enviado === true && r.invitacion_vista === true
  ).length;
  const tasaAperturaPct =
    invitacionesEnviadas > 0
      ? Math.min(
          100,
          Math.round((abrieronTrasCorreo / invitacionesEnviadas) * 1000) / 10
        )
      : 0;
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
    <div className="min-h-full bg-[#0B0F1A] pb-24">
      <div className="relative z-[1] mx-auto w-full max-w-[1200px] px-6">
        <section className="flex flex-col gap-4">
          <JourneyPhasesBar
            phase={journeyPhase}
            progressPrimary={journeyProgress.primary}
            progressHint={journeyProgress.hint}
          />
          <PanelPageHeader
            eyebrow="Invitados"
            title="Tu tripulación"
            subtitle={
              <>
                Gestiona tu lista y comparte invitaciones. Los datos del destino están en{" "}
                <Link href="/panel/evento" className="text-teal-400/90 underline hover:text-teal-300">
                  Evento
                </Link>
                .
              </>
            }
          />
          <div className="border-b border-white/10" aria-hidden />
        </section>

        {!hasAccess ? (
          <div className="mt-6">
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
          <div className="mt-4">
            <GrowthNudge
              message="Aún no creaste la ficha del evento. Cuando la completes, los invitados quedarán asociados automáticamente."
              href="/panel/evento"
              ctaLabel="Crear ficha del evento"
            />
          </div>
        )}

        {evento && !hasInvitados && (
          <div
            className="mt-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70"
            role="status"
          >
            <strong className="font-medium text-white/90">Te falta un paso:</strong> añade al menos una
            persona abajo para generar su invitación y compartirla.
          </div>
        )}

        {invitadosError && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm text-red-200/90">
            No pudimos cargar la lista. Intenta recargar la página. Si el problema sigue, contacta soporte.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
          <div id="agregar-invitados" className="scroll-mt-28 lg:col-span-8">
            <InvitadosManager eventoId={evento?.id ?? null} initialInvitados={invitados} />
          </div>

          {evento ? (
            <div className="lg:col-span-4">
              <InvitadosSidebar
                eventoId={evento.id}
                hasInvitados={hasInvitados}
                fromMission={fromMission}
                totalInvitados={invitados.length}
                emailsEnviados={invitacionesEnviadas}
                abrieronTrasCorreo={abrieronTrasCorreo}
                tasaAperturaPct={tasaAperturaPct}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
