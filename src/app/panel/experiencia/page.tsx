import { ExperienciaPageClient } from "@/components/panel/experiencia/ExperienciaPageClient";
import { JourneyPrimaryCta } from "@/components/panel/journey/JourneyPrimaryCta";
import { JourneyPhasesBar } from "@/components/panel/journey/JourneyPhasesBar";
import { PanelPageContainer } from "@/components/panel/PanelPageContainer";
import { PanelPageHeader } from "@/components/panel/PanelPageHeader";
import { selectEventoForMember } from "@/lib/evento-membership";
import { resolveJourneyPhase } from "@/lib/journey-phases";
import { getJourneyPhasesProgressLines } from "@/lib/journey-cards-progress";
import { loadPanelProgressBundle } from "@/lib/panel-progress-load";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ExperienciaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: evento } = await selectEventoForMember(
    supabase,
    user.id,
    "id, plan_status, nombre_novio_1, nombre_novio_2, fecha_boda, fecha_evento"
  );
  const bundle = await loadPanelProgressBundle(user.id);
  const isPaid = (evento as { plan_status?: string } | null)?.plan_status === "paid";
  const journeyPhase = resolveJourneyPhase(
    (evento as { fecha_boda?: string | null } | null)?.fecha_boda,
    (evento as { fecha_evento?: string | null } | null)?.fecha_evento
  );
  const journeyProgress = getJourneyPhasesProgressLines(bundle);
  const invitacionesEnviadas = bundle.invitados.filter((r) => r.email_enviado === true).length;
  const planStatus = (evento as { plan_status?: string } | null)?.plan_status ?? null;
  let canCheckout = false;
  let prefillNombre = "";
  const eventoId = (evento as { id?: string } | null)?.id ?? null;
  if (eventoId) {
    const { data: isAdmin } = await supabase.rpc("user_is_evento_admin", { p_evento_id: eventoId });
    canCheckout = planStatus !== "paid" && Boolean(isAdmin);
    const n1 = (evento as { nombre_novio_1?: string | null } | null)?.nombre_novio_1?.trim() ?? "";
    const n2 = (evento as { nombre_novio_2?: string | null } | null)?.nombre_novio_2?.trim() ?? "";
    prefillNombre = [n1, n2].filter(Boolean).join(" & ");
  }

  return (
    <PanelPageContainer>
      <div className="flex min-h-[13.5rem] flex-col gap-3 md:min-h-[15rem] md:gap-4">
        {!isPaid ? (
          <JourneyPrimaryCta
            invitados_count={bundle.invitados.length}
            plan_status={planStatus}
            payment_status={bundle.mockPaymentStatus}
            invitaciones_enviadas={invitacionesEnviadas}
            canCheckout={canCheckout}
            eventoId={eventoId}
            userEmail={user.email ?? ""}
            prefillNombre={prefillNombre || "Mi evento"}
            phase={journeyPhase}
          />
        ) : (
          <p className="text-xs font-medium tracking-wide text-[#D4AF37]/85">✨ Experiencia activa</p>
        )}
        <JourneyPhasesBar
          phase={journeyPhase}
          className={isPaid ? "mt-1.5 md:mt-2" : ""}
          progressPrimary={journeyProgress.primary}
          progressHint={journeyProgress.hint}
        />
      </div>

      <PanelPageHeader
        className="mt-3"
        eyebrow="Experiencia"
        title="Lo que vivirán"
        subtitle="Activá y configurá las funciones que comparten tus invitados."
        actions={
          <Link href="/panel" className="text-xs font-medium text-teal-400 hover:text-teal-300">
            ✨ Ver resumen del viaje
          </Link>
        }
      />

      <div className="mt-6">
        <ExperienciaPageClient isPaid={isPaid} />
      </div>
    </PanelPageContainer>
  );
}
