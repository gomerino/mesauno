"use client";

import type { AporteRegalo } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useMemo, useState } from "react";

type InvOpt = { id: string; nombre_pasajero: string };

type Props = {
  parejaId: string;
  invitados: InvOpt[];
  initialAportes: AporteRegalo[];
  tableMissing: boolean;
};

export function AportesManager({
  parejaId,
  invitados,
  initialAportes,
  tableMissing,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState(initialAportes);
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [invitadoId, setInvitadoId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = rows.reduce((s, r) => s + Number(r.monto ?? 0), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tableMissing) return;
    const n = Number(monto.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) {
      setError("Indica un monto válido");
      return;
    }
    setSaving(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("aportes_regalo")
      .insert({
        pareja_id: parejaId,
        monto: n,
        concepto: concepto.trim() || null,
        invitado_id: invitadoId || null,
      })
      .select("*")
      .maybeSingle();
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data) {
      setRows((r) => [data as AporteRegalo, ...r]);
      setMonto("");
      setConcepto("");
      setInvitadoId("");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este registro?")) return;
    const { error: err } = await supabase.from("aportes_regalo").delete().eq("id", id);
    if (err) {
      alert(err.message);
      return;
    }
    setRows((r) => r.filter((x) => x.id !== id));
  }

  if (tableMissing) {
    return (
      <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-100">
        <p className="font-medium">Falta la tabla de aportes en Supabase.</p>
        <p className="mt-2 text-orange-200/90">
          Ejecuta en el SQL Editor el bloque <code className="rounded bg-black/30 px-1">aportes_regalo</code>{" "}
          del archivo <code className="rounded bg-black/30 px-1">supabase/schema.sql</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-display text-lg font-bold text-white">Registrar aporte recibido</h2>
        <p className="mt-1 text-sm text-slate-400">
          Anota transferencias o efectivo para llevar un control (no sustituye tu banco).
        </p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-400">Monto (EUR)</label>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none ring-teal-500 focus:ring-2"
              inputMode="decimal"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">Invitado (opcional)</label>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none ring-teal-500 focus:ring-2"
              value={invitadoId}
              onChange={(e) => setInvitadoId(e.target.value)}
            >
              <option value="">— Sin asignar —</option>
              {invitados.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre_pasajero}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-400">Concepto / nota</label>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none ring-teal-500 focus:ring-2"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Regalo Ana, parte lista, etc."
            />
          </div>
          {error && (
            <p className="sm:col-span-2 rounded-lg bg-orange-500/20 px-3 py-2 text-sm text-orange-200">
              {error}
            </p>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-teal-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Registrar aporte"}
            </button>
          </div>
        </form>
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-xl font-bold text-white">Movimientos</h2>
          <p className="text-lg font-semibold text-teal-300">
            Total:{" "}
            {total.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
          </p>
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full min-w-[520px] text-left text-sm text-slate-200">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Invitado</th>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Aún no hay aportes registrados.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const inv = invitados.find((x) => x.id === (r.invitado_id ?? ""));
                  return (
                    <tr key={r.id} className="border-b border-white/5">
                      <td className="px-4 py-3 text-slate-400">
                        {r.created_at
                          ? new Date(r.created_at).toLocaleString("es-ES", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {Number(r.monto).toLocaleString("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </td>
                      <td className="px-4 py-3">{inv?.nombre_pasajero ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-400">{r.concepto ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          className="text-xs font-medium text-red-300 hover:text-red-200"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
