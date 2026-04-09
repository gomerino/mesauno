import { createClient } from "@/lib/supabase/server";
import { selectEventoForMember } from "@/lib/evento-membership";
import { AportesManager } from "@/components/panel/AportesManager";
import { fetchInvitadosPanelRows } from "@/lib/panel-invitados";
import type { AporteRegalo, Invitado } from "@/types/database";

export default async function RegalosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: evento } = await selectEventoForMember(supabase, user!.id, "id");

  const { data: invRows } = await fetchInvitadosPanelRows(
    supabase,
    user!.id,
    evento?.id ?? null,
    "id, nombre_pasajero",
    { orderBy: "nombre_pasajero", ascending: true }
  );

  const invitados = (invRows ?? []) as unknown as Pick<Invitado, "id" | "nombre_pasajero">[];

  let initialAportes: AporteRegalo[] = [];
  let tableMissing = false;

  if (evento) {
    const { data: apData, error: apError } = await supabase
      .from("aportes_regalo")
      .select("*")
      .eq("evento_id", evento.id)
      .order("created_at", { ascending: false });

    if (apError) {
      const msg = apError.message?.toLowerCase() ?? "";
      if (msg.includes("does not exist") || apError.code === "42P01") {
        tableMissing = true;
      }
    } else {
      initialAportes = (apData as AporteRegalo[]) ?? [];
    }
  }

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-white">Regalos y dinero</h1>
      <p className="mt-2 text-slate-400">
        Datos bancarios para regalos y registro manual de aportes recibidos.
      </p>

      <div className="mt-10 space-y-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-display text-lg font-bold text-white">Datos para transferencia</h2>
          <p className="mt-2 text-sm text-slate-400">
            Comparte estos datos con tus invitados (misma referencia que en la invitación).
          </p>
          <dl className="mt-6 grid gap-3 rounded-xl bg-black/40 p-4 font-mono text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4 sm:col-span-2">
              <dt className="text-slate-500">Banco</dt>
              <dd className="text-right text-white">Dreams Bank</dd>
            </div>
            <div className="flex justify-between gap-4 sm:col-span-2">
              <dt className="text-slate-500">IBAN</dt>
              <dd className="text-right text-teal-300">ES12 1234 5678 9012 3456 7890</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Titular</dt>
              <dd className="text-right text-white">Novios Dreams</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Concepto sugerido</dt>
              <dd className="text-right text-orange-300">Regalo + nombre</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">
            En producción puedes conectar Stripe u otro PSP; aquí el resumen es manual.
          </p>
        </div>

        {evento ? (
          <AportesManager
            eventoId={evento.id}
            invitados={invitados}
            initialAportes={initialAportes}
            tableMissing={tableMissing}
          />
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
            <p>
              Para usar la tabla de <strong className="text-slate-200">aportes</strong> y totales,
              crea el evento y tu usuario en <code className="text-teal-400">evento_miembros</code> (panel{" "}
              <code className="text-teal-400">/panel/evento</code> o migración). Los datos bancarios de arriba los
              puedes compartir igualmente.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
