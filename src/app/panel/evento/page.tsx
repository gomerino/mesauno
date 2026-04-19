import { JourneyPrimaryCta } from "@/components/panel/journey/JourneyPrimaryCta";
import { JourneyPhasesBar } from "@/components/panel/journey/JourneyPhasesBar";
import { MissionContextBanner } from "@/components/panel/MissionContextBanner";
import { PanelThemeSelector } from "@/components/panel/PanelThemeSelector";
import { EventoForm } from "@/components/panel/EventoForm";
import { selectEventoForMember } from "@/lib/evento-membership";
import { resolveJourneyPhase } from "@/lib/journey-phases";
import { getJourneyPhasesProgressLines } from "@/lib/journey-cards-progress";
import { isEventBasicsComplete } from "@/lib/panel-setup-progress";
import { loadPanelProgressBundle } from "@/lib/panel-progress-load";
import { createClient } from "@/lib/supabase/server";
import type { Evento } from "@/types/database";
import Link from "next/link";

function pickWelcome(raw: Record<string, string | string[] | undefined> | undefined): boolean {
  if (!raw) return false;
  const v = raw.welcome;
  const s = typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
  return s === "1" || s === "true";
}

function pickFromMission(raw: Record<string, string | string[] | undefined> | undefined): boolean {
  if (!raw) return false;
  const v = raw.from;
  const s = typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
  return s === "mission";
}

export default async function PanelEventoPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const showWelcomeBanner = pickWelcome(searchParams);
  const fromMission = pickFromMission(searchParams);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: evento } = await selectEventoForMember(supabase, user!.id, "*");
  const bundle = await loadPanelProgressBundle(user!.id);

  const eventoForProgress = (evento ?? null) as Evento | null;
  const basicsDone = isEventBasicsComplete(eventoForProgress);
  const journeyPhase = resolveJourneyPhase(eventoForProgress?.fecha_boda, eventoForProgress?.fecha_evento);
  const journeyProgress = getJourneyPhasesProgressLines(bundle);

  const invitadosCount = bundle.invitados.length;
  const invitacionesEnviadas = bundle.invitados.filter((r) => r.email_enviado === true).length;
  const planStatus = eventoForProgress?.plan_status ?? null;
  const hasAccess = planStatus === "paid";
  let canCheckout = false;
  let prefillNombre = "";
  if (eventoForProgress?.id) {
    const { data: isAdmin } = await supabase.rpc("user_is_evento_admin", { p_evento_id: eventoForProgress.id });
    canCheckout = planStatus !== "paid" && Boolean(isAdmin);
    const n1 = eventoForProgress.nombre_novio_1?.trim() ?? "";
    const n2 = eventoForProgress.nombre_novio_2?.trim() ?? "";
    prefillNombre = [n1, n2].filter(Boolean).join(" & ");
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      {showWelcomeBanner ? (
        <div
          className="mb-4 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-xs text-teal-50"
          role="status"
        >
          <span className="font-medium text-white">¡Bienvenidos!</span> Completá los datos de abajo para seguir con
          tu viaje.
        </div>
      ) : null}

      <div className="flex min-h-[13.5rem] flex-col gap-3 md:min-h-[15rem] md:gap-4">
        {!hasAccess ? (
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
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-400/80">Tu evento</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">Tu destino</h1>
        <p className="mt-1 text-sm text-slate-400">Lo esencial para que invitados y programa hablen el mismo idioma.</p>
        <p className="mt-2">
          <Link href="/panel" className="text-xs font-medium text-teal-400 hover:text-teal-300">
            ✨ 100% listo · Ver resumen
          </Link>
        </p>
      </header>

      <MissionContextBanner
        fromMission={fromMission}
        missionKey="evento"
        title={basicsDone ? "Misión Evento" : "Misión Evento"}
        message={
          basicsDone
            ? "Ya está tu destino confirmado. Puedes ajustar detalles o volver al panel."
            : "Completa nombres y fecha para marcar este destino como listo."
        }
      />

      {!basicsDone ? (
        <p className="mt-3 text-xs text-slate-500" role="status">
          Falta: nombres de ambos y fecha para marcar el destino como listo.
        </p>
      ) : null}

      <div className="mt-4">
        <EventoForm initial={(evento ?? null) as Evento | null} />
      </div>

      <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/[0.06] pt-4 text-xs" aria-label="Ir a otros módulos">
        <Link href="/panel/programa" className="text-teal-400/90 hover:text-teal-300">
          Programa
        </Link>
        <Link href="/panel/invitacion" className="text-teal-400/90 hover:text-teal-300">
          Invitaciones
        </Link>
        <Link href="/panel/experiencia" className="text-teal-400/90 hover:text-teal-300">
          Experiencia
        </Link>
      </nav>
    </div>
  );
}
