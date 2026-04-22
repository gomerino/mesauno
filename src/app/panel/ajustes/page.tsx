import { PanelBackLink } from "@/components/panel/PanelBackLink";
import { PanelLayout } from "@/components/panel/ds";
import { JourneyPrimaryCta } from "@/components/panel/journey/JourneyPrimaryCta";
import { JourneyPhasesBar } from "@/components/panel/journey/JourneyPhasesBar";
import { EquipoPageClient } from "@/components/dashboard/EquipoPageClient";
import { formatEventTitle } from "@/lib/couple-event-title";
import { requirePanelScopedEventoId } from "@/lib/panel-evento-scope";
import { resolveJourneyPhase } from "@/lib/journey-phases";
import { getJourneyPhasesProgressLines } from "@/lib/journey-cards-progress";
import { loadPanelProgressBundle } from "@/lib/panel-progress-load";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type MiembroRow = {
  user_id: string;
  email: string;
  rol: string;
  created_at: string | null;
};

function parseList(data: unknown): MiembroRow[] {
  if (Array.isArray(data)) return data as MiembroRow[];
  if (typeof data === "string") {
    try {
      const p = JSON.parse(data) as unknown;
      return Array.isArray(p) ? (p as MiembroRow[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default async function PanelEquipoPage() {
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

  const { data: rawList, error: listErr } = await supabase.rpc("evento_equipo_list", {
    p_evento_id: evento_id,
  });

  const { data: isAdmin } = await supabase.rpc("user_is_evento_admin", {
    p_evento_id: evento_id,
  });

  const { data: evento } = await supabase
    .from("eventos")
    .select("nombre_novio_1, nombre_novio_2, nombre_evento")
    .eq("id", evento_id)
    .maybeSingle();

  const miembros = listErr ? [] : parseList(rawList);
  const titulo = formatEventTitle(evento);
  const journeyPhase = resolveJourneyPhase(eventoBundle?.fecha_boda, eventoBundle?.fecha_evento);
  const journeyProgress = getJourneyPhasesProgressLines(bundle);
  const planStatus = eventoBundle?.plan_status ?? null;
  const hasAccess = planStatus === "paid";
  const invitacionesEnviadas = bundle.invitados.filter((r) => r.email_enviado === true).length;
  let canCheckout = false;
  let prefillNombre = "";
  if (eventoBundle?.id) {
    const { data: adminForCheckout } = await supabase.rpc("user_is_evento_admin", {
      p_evento_id: eventoBundle.id,
    });
    canCheckout = planStatus !== "paid" && Boolean(adminForCheckout);
    const n1 = eventoBundle.nombre_novio_1?.trim() ?? "";
    const n2 = eventoBundle.nombre_novio_2?.trim() ?? "";
    prefillNombre = [n1, n2].filter(Boolean).join(" & ");
  }

  return (
    <PanelLayout narrow>
      <PanelBackLink />
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
      </div>

      <header className="mt-3 border-b border-white/[0.06] pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-400/80">Ajustes</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
          ¿Quién organiza contigo?
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Invita a tu pareja o a quien te ayude con la logística del evento{" "}
          <span className="font-medium text-slate-200">{titulo}</span>.
        </p>
        <p className="mt-2">
          <Link href="/panel" className="text-xs font-medium text-teal-400 hover:text-teal-300">
            ✨ 100% listo · Ver resumen
          </Link>
        </p>
      </header>

      {listErr && (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          No pudimos cargar el equipo. Si persiste, contactá soporte e indicá este mensaje: {listErr.message}
        </p>
      )}

      <div className="mt-6">
        <EquipoPageClient
          eventoId={evento_id}
          initialMiembros={miembros}
          isAdmin={Boolean(isAdmin)}
        />
      </div>
    </PanelLayout>
  );
}
