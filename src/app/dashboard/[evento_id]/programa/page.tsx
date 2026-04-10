import { ProgramaHitosManager } from "@/components/dashboard/ProgramaHitosManager";
import { createClient } from "@/lib/supabase/server";
import type { EventoProgramaHito } from "@/types/database";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardProgramaPage({ params }: { params: Promise<{ evento_id: string }> }) {
  const { evento_id } = await params;
  const supabase = await createClient();

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

  const titulo =
    [evento?.nombre_novio_1, evento?.nombre_novio_2].filter(Boolean).join(" & ") ||
    evento?.nombre_evento ||
    "Evento";

  const hitos = (rawHitos ?? []) as EventoProgramaHito[];
  const tableMissing =
    Boolean(error) &&
    (error?.message?.toLowerCase().includes("does not exist") ||
      error?.message?.includes("evento_programa_hitos") ||
      error?.code === "42P01");

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        <Link href={`/dashboard/${evento_id}/equipo`} className="text-teal-400 hover:text-teal-300">
          ← Equipo
        </Link>
        {" · "}
        <Link href="/panel/evento" className="text-teal-400 hover:text-teal-300">
          Configuración novios
        </Link>
      </p>
      <h1 className="font-display mt-2 text-3xl font-bold text-white">Programa del evento</h1>
      <p className="mt-2 text-slate-400">
        Cronograma que verán los invitados en su invitación (timeline). Evento:{" "}
        <span className="text-slate-200">{titulo}</span>.
      </p>

      {error && !tableMissing ? (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error.message}
        </p>
      ) : null}

      {tableMissing ? (
        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium">Falta la tabla en Supabase.</p>
          <p className="mt-1 text-amber-200/90">
            Ejecuta en el SQL Editor el archivo{" "}
            <code className="rounded bg-black/30 px-1">migration_evento_programa.sql</code>.
          </p>
        </div>
      ) : (
        <div className="mt-8">
          <ProgramaHitosManager eventoId={evento_id} initialHitos={hitos} />
        </div>
      )}
    </div>
  );
}
