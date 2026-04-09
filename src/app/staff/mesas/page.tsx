import { fetchStaffEventoIds, resolveStaffEventoId } from "@/lib/staff-eventos";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Row = {
  invitado_id: string;
  nombre_pasajero: string;
  asiento: string | null;
  restricciones_alimenticias: unknown;
  rsvp_estado: string | null;
  asistencia_confirmada: boolean;
};

export default async function StaffMesasPage({
  searchParams,
}: {
  searchParams: Promise<{ evento?: string; asiento?: string; rest?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ids = await fetchStaffEventoIds(supabase, user.id);
  const sp = await searchParams;
  const eventoId = resolveStaffEventoId(ids, sp.evento);
  if (!eventoId) return null;

  const asientoQ = sp.asiento?.trim() || null;
  const restQ = sp.rest?.trim() || null;

  const { data, error } = await supabase.rpc("staff_list_invitados_evento", {
    p_evento_id: eventoId,
    p_asiento_q: asientoQ,
    p_restriccion_q: restQ,
  });

  if (error) {
    return <p className="text-sm text-red-300">{error.message}</p>;
  }

  const rows = normalizeStaffList(data);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Lista de invitados</h1>
        <p className="mt-1 text-sm text-slate-400">
          Filtra por asiento/mesa o por texto en restricciones (p. ej. vegetariano).
        </p>
      </div>

      <form method="get" className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <input type="hidden" name="evento" value={eventoId} />
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Asiento / mesa
          <input
            name="asiento"
            defaultValue={asientoQ ?? ""}
            placeholder="Ej. 12A o Mesa 3"
            className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-600"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Restricción
          <input
            name="rest"
            defaultValue={restQ ?? ""}
            placeholder="Ej. vegano, sin gluten"
            className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-600"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-[#001d66] py-2.5 text-sm font-semibold text-white"
          >
            Aplicar filtros
          </button>
          <Link
            href={`/staff/mesas?evento=${encodeURIComponent(eventoId)}`}
            className="rounded-xl border border-white/20 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5"
          >
            Limpiar
          </Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-black/30 text-[10px] uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Asiento</th>
              <th className="px-3 py-2">RSVP</th>
              <th className="px-3 py-2">Entrada</th>
              <th className="px-3 py-2">Restricciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                  Sin resultados.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.invitado_id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="px-3 py-2 font-medium text-white">{r.nombre_pasajero}</td>
                <td className="px-3 py-2 text-slate-300">{r.asiento ?? "—"}</td>
                <td className="px-3 py-2 capitalize text-slate-300">{r.rsvp_estado ?? "—"}</td>
                <td className="px-3 py-2">
                  {r.asistencia_confirmada ? (
                    <span className="text-teal-300">Sí</span>
                  ) : (
                    <span className="text-slate-500">No</span>
                  )}
                </td>
                <td className="max-w-[10rem] px-3 py-2 text-xs text-slate-400">
                  {formatRest(r.restricciones_alimenticias)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatRest(raw: unknown): string {
  if (raw == null) return "—";
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean).join(", ") || "—";
  return String(raw);
}

function normalizeStaffList(data: unknown): Row[] {
  if (Array.isArray(data)) return data as Row[];
  if (typeof data === "string") {
    try {
      const p = JSON.parse(data) as unknown;
      return Array.isArray(p) ? (p as Row[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}
