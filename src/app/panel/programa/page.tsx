import { JourneyPrimaryCta } from "@/components/panel/journey/JourneyPrimaryCta";
import { JourneyPhasesBar } from "@/components/panel/journey/JourneyPhasesBar";
import { MissionContextBanner } from "@/components/panel/MissionContextBanner";
import { PanelThemeSelector } from "@/components/panel/PanelThemeSelector";
import { ProgramaHitosManager } from "@/components/dashboard/ProgramaHitosManager";
import { formatEventTitle } from "@/lib/couple-event-title";
import { requirePanelScopedEventoId } from "@/lib/panel-evento-scope";
import { resolveJourneyPhase } from "@/lib/journey-phases";
import { getJourneyPhasesProgressLines } from "@/lib/journey-cards-progress";
import { loadPanelProgressBundle } from "@/lib/panel-progress-load";
import { createClient } from "@/lib/supabase/server";
import type { EventoProgramaHito } from "@/types/database";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PanelProgramaPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const fromMissionRaw = searchParams?.from;
  const fromMission =
    fromMissionRaw === "mission" || (Array.isArray(fromMissionRaw) && fromMissionRaw.includes("mission"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const bundle = await loadPanelProgressBundle(user!.id);
  const eventoBundle = bundle.evento;

  const scope = await requirePanelScopedEventoId(supabase, user!.id);
  if (!scope.ok) {
    redirect(scope.redirect);
  }
  const evento_id = scope.eventoId;

  const { data: evento } = await supabase
    .from("eventos")
    .select("nombre_novio_1, nombre_novio_2, nombre_evento")
    .eq("id", evento_id)
    .maybeSingle();

  const { data: rawHitos, error } = await supabase
    .from("evento_programa_hitos")
    .select("*")
    .eq("evento_id", evento_id)
    .order("orden", { ascending: true })
    .order("hora", { ascending: true });

  const titulo = formatEventTitle(evento);
  const journeyPhase = resolveJourneyPhase(eventoBundle?.fecha_boda, eventoBundle?.fecha_evento);
  const journeyProgress = getJourneyPhasesProgressLines(bundle);
  const planStatus = eventoBundle?.plan_status ?? null;
  const hasAccess = planStatus === "paid";
  const invitacionesEnviadas = bundle.invitados.filter((r) => r.email_enviado === true).length;
  let canCheckout = false;
  let prefillNombre = "";
  if (eventoBundle?.id) {
    const { data: isAdmin } = await supabase.rpc("user_is_evento_admin", { p_evento_id: eventoBundle.id });
    canCheckout = planStatus !== "paid" && Boolean(isAdmin);
    const n1 = eventoBundle.nombre_novio_1?.trim() ?? "";
    const n2 = eventoBundle.nombre_novio_2?.trim() ?? "";
    prefillNombre = [n1, n2].filter(Boolean).join(" & ");
  }

  const hitos = (rawHitos ?? []) as EventoProgramaHito[];
  const tableMissing =
    Boolean(error) &&
    (error?.message?.toLowerCase().includes("does not exist") ||
      error?.message?.includes("evento_programa_hitos") ||
      error?.code === "42P01");

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex min-h-[13.5rem] flex-col gap-3 md:min-h-[15rem] md:gap-4">
        {!hasAccess ? (
          <JourneyPrimaryCta
            invitados_count={bundle.invitados.length}
            plan_status={planStatus}
            payment_status={bundle.mockPaymentStatus}
            invitaciones_enviadas={invitacionesEnviadas}
            canCheckout={canCheckout}
            eventoId={eventoBundle?.id ?? null}
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
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-400/80">Día del evento</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">¿Cómo será el día?</h1>
        <p className="mt-1 text-sm text-slate-400">
          Edita el cronograma que verán tus invitados para <span className="font-medium text-slate-200">{titulo}</span>.
        </p>
        <p className="mt-2">
          <Link href="/panel" className="text-xs font-medium text-teal-400 hover:text-teal-300">
            ✨ 100% listo · Ver resumen
          </Link>
        </p>
      </header>

      <MissionContextBanner
        fromMission={fromMission}
        missionKey="programa"
        title="Misión Programa"
        message={
          hitos.length > 0
            ? "Puedes seguir ajustando los momentos del día o volver al panel."
            : "Arma los momentos clave del día para guiar a tus invitados."
        }
      />

      {error && !tableMissing ? (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          No pudimos cargar el programa: {error.message}
        </p>
      ) : null}

      {tableMissing ? (
        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium">El cronograma aún no está activo en tu entorno.</p>
          <p className="mt-1 text-amber-200/90">
            Tu equipo técnico debe aplicar la migración del programa en la base de datos (referencia interna:{" "}
            <code className="rounded bg-black/30 px-1">migration_evento_programa.sql</code>).
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <ProgramaHitosManager eventoId={evento_id} initialHitos={hitos} />
        </div>
      )}
    </div>
  );
}
