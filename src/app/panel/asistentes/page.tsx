import { createClient } from "@/lib/supabase/server";
import { selectEventoForMember } from "@/lib/evento-membership";
import { fetchInvitadosPanelRows } from "@/lib/panel-invitados";
import { restriccionesFromDb } from "@/lib/restricciones-alimenticias";
import type { Invitado } from "@/types/database";

function Table({
  title,
  rows,
  accent,
}: {
  title: string;
  rows: Invitado[];
  accent: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="mt-8">
      <h2 className={`font-display text-xl font-bold ${accent}`}>
        {title} ({rows.length})
      </h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[480px] text-left text-sm text-slate-200">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-slate-500">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Restricciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="px-4 py-3 font-medium text-white">{r.nombre_pasajero}</td>
                <td className="px-4 py-3">{r.email ?? "—"}</td>
                <td className="px-4 py-3">{r.telefono ?? "—"}</td>
                <td className="px-4 py-3 text-slate-400">
                  {restriccionesFromDb(r.restricciones_alimenticias) || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function AsistentesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: evento } = await selectEventoForMember(supabase, user!.id, "id");

  const { data: rows } = await fetchInvitadosPanelRows(supabase, user!.id, evento?.id ?? null, "*", {
    orderBy: "nombre_pasajero",
    ascending: true,
  });

  const list = (rows ?? []) as unknown as Invitado[];
  const confirmados = list.filter((i) => i.rsvp_estado === "confirmado");
  const declinados = list.filter((i) => i.rsvp_estado === "declinado");
  const pendientes = list.filter((i) => !i.rsvp_estado || i.rsvp_estado === "pendiente");

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-white">Asistentes (RSVP)</h1>
      <p className="mt-2 text-slate-400">
        Invitados que aceptaron la invitación, los que declinaron y pendientes de respuesta.
      </p>

      {list.length === 0 ? (
        <p className="mt-8 text-slate-500">
          No hay invitados todavía.{" "}
          <a href="/panel/invitados" className="text-teal-300 underline hover:text-teal-200">
            Crear invitados
          </a>
        </p>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap gap-4">
            <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-3">
              <p className="text-xs uppercase text-teal-200/80">Confirmados</p>
              <p className="font-display text-2xl font-bold text-teal-200">{confirmados.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase text-slate-500">Pendientes</p>
              <p className="font-display text-2xl font-bold text-white">{pendientes.length}</p>
            </div>
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3">
              <p className="text-xs uppercase text-orange-200/80">Declinaron</p>
              <p className="font-display text-2xl font-bold text-orange-200">{declinados.length}</p>
            </div>
          </div>

          <Table title="Aceptaron la invitación" rows={confirmados} accent="text-teal-300" />
          <Table title="Pendientes de confirmar" rows={pendientes} accent="text-slate-200" />
          <Table title="No asistirán" rows={declinados} accent="text-orange-300" />
        </>
      )}
    </>
  );
}
