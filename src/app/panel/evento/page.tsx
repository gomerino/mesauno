import { CouplePageHeader } from "@/components/app/CouplePageHeader";
import { EventoForm } from "@/components/panel/EventoForm";
import { selectEventoForMember } from "@/lib/evento-membership";
import { isEventBasicsComplete } from "@/lib/panel-setup-progress";
import { loadPanelProgressBundle, panelNextActionHref } from "@/lib/panel-progress-load";
import { createClient } from "@/lib/supabase/server";
import type { Evento } from "@/types/database";
import Link from "next/link";

function pickWelcome(raw: Record<string, string | string[] | undefined> | undefined): boolean {
  if (!raw) return false;
  const v = raw.welcome;
  const s = typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
  return s === "1" || s === "true";
}

export default async function PanelEventoPage({
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
  const { pct, nextStep } = await loadPanelProgressBundle(supabase, user!.id);
  const progressHref = panelNextActionHref(nextStep);

  const eventoForProgress = (evento ?? null) as Evento | null;
  const basicsDone = isEventBasicsComplete(eventoForProgress);

  return (
    <>
      {showWelcomeBanner && (
        <div
          className="mb-6 rounded-xl border border-teal-500/35 bg-teal-500/10 px-4 py-3 text-sm text-teal-50 shadow-[0_0_0_1px_rgba(20,184,166,0.15)]"
          role="status"
        >
          <strong className="font-semibold text-white">¡Bienvenidos!</strong> Completa los datos de abajo, añade
          invitados y comparte el enlace desde el menú cuando estés listos.
        </div>
      )}
      <CouplePageHeader
        eyebrow="Tu evento"
        title="Configuración base del destino"
        subtitle={
          <>
            Configura lo esencial del evento en un solo lugar. El programa, recordatorios y experiencia se gestionan en
            sus módulos dedicados para mantener este paso simple.
            {" "}
            La lista de invitados la cargas en{" "}
            <Link href="/panel/invitados" className="text-teal-300 underline hover:text-teal-200">
              Invitados
            </Link>
            .
          </>
        }
      />
      <div className="mt-4">
        <Link href={progressHref} className="text-xs font-medium text-teal-300/85 hover:text-teal-200">
          ✨ {pct}% listo · Ver resumen
        </Link>
      </div>

      {!basicsDone && (
        <div className="mt-6 rounded-xl border border-teal-500/30 bg-teal-500/[0.12] px-4 py-3 text-sm text-teal-50" role="status">
          <strong className="font-medium text-white">Te falta un poco:</strong> completa nombre de ambos y la fecha en
          el formulario de abajo para que la invitación quede lista.
        </div>
      )}

      <div className="mt-10">
        <EventoForm initial={(evento ?? null) as Evento | null} />
      </div>

      <section className="mt-12 border-t border-white/[0.08] pt-6">
        <p className="text-sm text-slate-400">Continúa configurando tu viaje</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link href="/panel/programa" className="text-teal-300 underline decoration-teal-500/50 underline-offset-2 hover:text-teal-200">
            Ir a Programa
          </Link>
          <Link href="/panel/invitacion" className="text-teal-300 underline decoration-teal-500/50 underline-offset-2 hover:text-teal-200">
            Ir a Invitaciones
          </Link>
          <Link href="/panel/experiencia" className="text-teal-300 underline decoration-teal-500/50 underline-offset-2 hover:text-teal-200">
            Ir a Experiencia
          </Link>
        </div>
      </section>
    </>
  );
}
