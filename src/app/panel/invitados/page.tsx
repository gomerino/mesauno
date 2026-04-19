import { GrowthNudge } from "@/components/app/GrowthNudge";
import { GuestsMissionContextClient } from "@/components/panel/GuestsMissionContextClient";
import { JourneyPrimaryCta } from "@/components/panel/journey/JourneyPrimaryCta";
import { JourneyPhasesBar } from "@/components/panel/journey/JourneyPhasesBar";
import { PanelThemeSelector } from "@/components/panel/PanelThemeSelector";
import { createClient } from "@/lib/supabase/server";
import { InvitadosManager } from "@/components/InvitadosManager";
import { fetchInvitadosPanelRowsWithAcompanantes } from "@/lib/panel-invitados";
import { resolveJourneyPhase } from "@/lib/journey-phases";
import { getJourneyPhasesProgressLines } from "@/lib/journey-cards-progress";
import { loadPanelProgressBundle } from "@/lib/panel-progress-load";
import { resolveGuestMissionState } from "@/lib/guest-mission";
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
  const invitadosMission = resolveGuestMissionState(invitados);
  const journeyPhase = resolveJourneyPhase(evento?.fecha_boda, evento?.fecha_evento);
  const journeyProgress = getJourneyPhasesProgressLines({
    ...bundle,
    invitados,
  });
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
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex min-h-[13.5rem] flex-col gap-3 md:min-h-[15rem] md:gap-4">
        {!hasAccess ? (
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
        ) : (
          <p className="text-xs font-medium tracking-wide text-[#D4AF37]/85">✨ Experiencia activa</p>
        )}
        <JourneyPhasesBar
          phase={journeyPhase}
          className={hasAccess ? "mt-1.5 md:mt-2" : ""}
          progressPrimary={journeyProgress.primary}
          progressHint={journeyProgress.hint}
        />
        <div className="mt-3 md:mt-3">
          <PanelThemeSelector />
        </div>
      </div>

      <header className="mt-3 border-b border-white/[0.06] pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-400/80">Invitados</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">Tu tripulación</h1>
        <p className="mt-1 text-sm text-slate-400">
          Gestiona tu lista y comparte invitaciones. Los datos del destino están en{" "}
          <Link href="/panel/evento" className="text-teal-300 underline hover:text-teal-200">
            Evento
          </Link>
          .
        </p>
      </header>

      <GuestsMissionContextClient
        fromMission={fromMission}
        missionState={invitadosMission}
        hasInvitados={hasInvitados}
      />

      {evento && !hasInvitados && (
        <div className="mt-4 md:hidden">
          <a
            href="#agregar-invitados"
            className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-teal-500 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-950/30 hover:bg-teal-400"
          >
            Agregar invitados
          </a>
        </div>
      )}

      {!evento && (
        <div className="mt-6">
          <GrowthNudge
            message="Aún no creaste la ficha del evento. Cuando la completes, los invitados quedarán asociados automáticamente."
            href="/panel/evento"
            ctaLabel="Crear ficha del evento"
          />
        </div>
      )}

      {evento && !hasInvitados && (
        <div
          className="mt-6 rounded-xl border border-teal-500/30 bg-teal-500/[0.12] px-4 py-3 text-sm text-teal-50"
          role="status"
        >
          <strong className="font-medium text-white">Te falta un paso:</strong> añade al menos una persona abajo para
          generar su invitación y compartirla.
        </div>
      )}

      {invitadosError && (
        <p className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          No pudimos cargar la lista. Intentá recargar la página. Si el problema sigue, contactá soporte.
        </p>
      )}

      <div id="agregar-invitados" className="mt-6 scroll-mt-28">
        <InvitadosManager eventoId={evento?.id ?? null} initialInvitados={invitados} />
      </div>
    </div>
  );
}
