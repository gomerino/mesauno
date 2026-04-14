import { CouplePageHeader } from "@/components/app/CouplePageHeader";
import { PanelSubpageChrome } from "@/components/panel/PanelSubpageChrome";
import { ProgramaHitosManager } from "@/components/dashboard/ProgramaHitosManager";
import { formatEventTitle } from "@/lib/couple-event-title";
import { requirePanelScopedEventoId } from "@/lib/panel-evento-scope";
import { createClient } from "@/lib/supabase/server";
import type { EventoProgramaHito } from "@/types/database";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PanelProgramaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const hitos = (rawHitos ?? []) as EventoProgramaHito[];
  const tableMissing =
    Boolean(error) &&
    (error?.message?.toLowerCase().includes("does not exist") ||
      error?.message?.includes("evento_programa_hitos") ||
      error?.code === "42P01");

  return (
    <PanelSubpageChrome>
      <CouplePageHeader
        eyebrow="Día del evento"
        title="¿Cómo será el día?"
        subtitle={
          <>
            Este es el cronograma que ven tus invitados en la invitación. Ahora mismo editas el plan de{" "}
            <span className="font-medium text-slate-200">{titulo}</span>. Añade ceremonia, coctel, fiesta y enlaces a mapas.
          </>
        }
      />

      {error && !tableMissing ? (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
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
        <div className="mt-8">
          <ProgramaHitosManager eventoId={evento_id} initialHitos={hitos} />
        </div>
      )}
    </PanelSubpageChrome>
  );
}
