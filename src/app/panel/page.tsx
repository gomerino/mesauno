import { createClient } from "@/lib/supabase/server";
import { invitadosDelPanel } from "@/lib/panel-invitados";
import type { Invitado } from "@/types/database";
import Link from "next/link";

export default async function PanelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pareja } = await supabase
    .from("parejas")
    .select("id, nombre_novio_1, nombre_novio_2, fecha_boda")
    .eq("user_id", user!.id)
    .maybeSingle();

  const { data: invRows } = await invitadosDelPanel(
    supabase,
    user!.id,
    pareja?.id ?? null,
    "rsvp_estado"
  );

  const inv = (invRows ?? []) as unknown as Invitado[];
  const totalInv = inv.length;
  const confirmados = inv.filter((r) => r.rsvp_estado === "confirmado").length;

  let totalAportes = 0;
  if (pareja) {
    const { data: apRows, error: apErr } = await supabase
      .from("aportes_regalo")
      .select("monto")
      .eq("pareja_id", pareja.id);

    if (!apErr && apRows) {
      totalAportes = apRows.reduce((s, r) => s + Number(r.monto ?? 0), 0);
    }
  }

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-white">Panel de novios</h1>
      <p className="mt-2 text-slate-400">
        Configura <Link href="/panel/pareja-evento" className="text-teal-300 hover:text-teal-200">pareja y evento</Link>{" "}
        una vez; luego usa el menú para invitados, vista previa, RSVP y regalos.
      </p>

      {!pareja && (
        <div className="mt-6 space-y-4">
          <p className="rounded-lg border border-dashed border-white/20 p-4 text-sm text-slate-400">
            Crea tu registro de pareja y el evento aquí (o en Supabase). Puedes añadir invitados antes;
            quedarán asociados a tu cuenta hasta que exista la fila en{" "}
            <code className="text-teal-400">parejas</code>.
          </p>
          <Link
            href="/panel/pareja-evento"
            className="inline-flex rounded-full bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-400"
          >
            Configurar pareja y evento
          </Link>
        </div>
      )}

      {pareja && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-lg text-white">
            {pareja.nombre_novio_1} & {pareja.nombre_novio_2}
          </p>
          {pareja.fecha_boda && (
            <p className="mt-2 text-sm text-slate-400">Fecha boda: {String(pareja.fecha_boda)}</p>
          )}
          <Link
            href="/panel/pareja-evento"
            className="mt-4 inline-block text-sm font-medium text-teal-300 hover:text-teal-200"
          >
            Editar pareja y evento →
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Invitados</p>
          <p className="font-display mt-2 text-3xl font-bold text-white">{totalInv}</p>
          <Link href="/panel/invitados" className="mt-3 inline-block text-sm text-teal-300 hover:text-teal-200">
            Gestionar →
          </Link>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Confirmaron asistencia</p>
          <p className="font-display mt-2 text-3xl font-bold text-teal-300">{confirmados}</p>
          <Link href="/panel/asistentes" className="mt-3 inline-block text-sm text-teal-300 hover:text-teal-200">
            Ver detalle →
          </Link>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Aportes registrados</p>
          <p className="font-display mt-2 text-2xl font-bold text-orange-300">
            {pareja
              ? totalAportes.toLocaleString("es-ES", { style: "currency", currency: "EUR" })
              : "—"}
          </p>
          <Link href="/panel/regalos" className="mt-3 inline-block text-sm text-teal-300 hover:text-teal-200">
            Regalos y dinero →
          </Link>
          {!pareja && (
            <p className="mt-2 text-xs text-slate-500">Requiere pareja vinculada</p>
          )}
        </div>
      </div>
    </>
  );
}
