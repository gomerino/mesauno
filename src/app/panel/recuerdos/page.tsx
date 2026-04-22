import { PanelBackLink } from "@/components/panel/PanelBackLink";
import { PanelLayout } from "@/components/panel/ds";
import { JourneyPhasesBar } from "@/components/panel/journey/JourneyPhasesBar";
import { loadPanelProgressBundle } from "@/lib/panel-progress-load";
import { resolveJourneyPhase } from "@/lib/journey-phases";
import { getJourneyPhasesProgressLines } from "@/lib/journey-cards-progress";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PanelRecuerdosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const bundle = await loadPanelProgressBundle(user!.id);
  const evento = bundle.evento;
  const journeyPhase = resolveJourneyPhase(evento?.fecha_boda, evento?.fecha_evento);
  const journeyProgress = getJourneyPhasesProgressLines(bundle);

  return (
    <PanelLayout>
      <PanelBackLink />
      <section className="flex flex-col gap-4">
        <JourneyPhasesBar
          phase={journeyPhase}
          progressPrimary={journeyProgress.primary}
          progressHint={journeyProgress.hint}
        />
        <header className="border-b border-white/10 pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-400/80">Aterrizaje</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">Lo que queda del viaje</h1>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Un lugar para volver cuando el gran día pasó: regalos, recuerdos y los detalles que querés conservar.
          </p>
        </header>
      </section>

      <ul className="mt-8 flex flex-col gap-3 text-sm">
        <li>
          <Link
            href="/panel/finanzas"
            className="block rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white/85 transition hover:border-teal-400/30 hover:bg-white/[0.06]"
          >
            <span className="font-medium text-white">Regalos y números</span>
            <span className="mt-1 block text-xs text-white/50">Lista de regalos y seguimiento</span>
          </Link>
        </li>
        <li>
          <Link
            href="/panel/pasajeros/vista"
            className="block rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white/85 transition hover:border-teal-400/30 hover:bg-white/[0.06]"
          >
            <span className="font-medium text-white">Vista previa del pase</span>
            <span className="mt-1 block text-xs text-white/50">Cómo ven tu invitación quienes vuelan con ustedes</span>
          </Link>
        </li>
      </ul>
    </PanelLayout>
  );
}
