"use client";

import { staffRegistrarEntradaAction, staffResolveQrAction } from "@/app/staff/actions";
import { QRScanner } from "@/components/staff/QRScanner";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type Preview = {
  invitado_id: string;
  nombre_pasajero: string;
  asiento: string | null;
  restricciones_alimenticias: unknown;
  rsvp_estado: string | null;
  asistencia_confirmada: boolean;
};

type Props = {
  eventoId: string;
};

export function StaffCheckInClient({ eventoId }: Props) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);

  const handleScan = useCallback(
    async (raw: string) => {
      setLoading(true);
      const res = await staffResolveQrAction(eventoId, raw);
      setLoading(false);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const p = res.payload;
      if (p.ok !== true || typeof p.invitado_id !== "string") {
        toast.error("Código no reconocido");
        return;
      }
      setPreview({
        invitado_id: p.invitado_id,
        nombre_pasajero: String(p.nombre_pasajero ?? ""),
        asiento: (p.asiento as string | null) ?? null,
        restricciones_alimenticias: p.restricciones_alimenticias,
        rsvp_estado: (p.rsvp_estado as string | null) ?? null,
        asistencia_confirmada: Boolean(p.asistencia_confirmada),
      });
      toast.success("Invitado encontrado");
    },
    [eventoId]
  );

  async function registrar() {
    if (!preview) return;
    setLoading(true);
    const res = await staffRegistrarEntradaAction(preview.invitado_id);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Entrada registrada");
    setPreview((p) => (p ? { ...p, asistencia_confirmada: true } : null));
  }

  function continuarEscaneando() {
    setPreview(null);
  }

  const restricciones = normalizeRestricciones(preview?.restricciones_alimenticias);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Check-in</h1>
        <p className="mt-1 text-sm text-slate-400">Apunta al QR del invitado. La validación es en el servidor.</p>
      </div>

      {!preview && (
        <div className="relative min-h-[200px] space-y-3">
          {loading && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-slate-950/85 backdrop-blur-sm"
              role="status"
              aria-live="polite"
            >
              <span
                className="h-10 w-10 animate-spin rounded-full border-2 border-teal-400/30 border-t-teal-400"
                aria-hidden
              />
              <p className="text-sm font-medium text-white">Validando código…</p>
            </div>
          )}
          <QRScanner onScan={(t) => void handleScan(t)} scanningEnabled={!loading} />
        </div>
      )}

      {preview && (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-teal-300">Invitado</p>
          <p className="font-display text-xl font-bold text-white">{preview.nombre_pasajero}</p>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
              <dt className="text-slate-500">Asiento / mesa</dt>
              <dd className="font-medium text-white">{preview.asiento ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
              <dt className="text-slate-500">RSVP</dt>
              <dd className="font-medium capitalize text-white">{preview.rsvp_estado ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Restricciones alimenticias</dt>
              <dd className="mt-1 text-white">
                {restricciones.length ? restricciones.join(", ") : "Ninguna indicada"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 pt-1">
              <dt className="text-slate-500">Estado entrada</dt>
              <dd className={preview.asistencia_confirmada ? "text-teal-300" : "text-amber-300"}>
                {preview.asistencia_confirmada ? "Ya registrada" : "Pendiente"}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            {!preview.asistencia_confirmada && (
              <button
                type="button"
                disabled={loading}
                onClick={() => void registrar()}
                className="flex-1 rounded-xl bg-teal-500 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/30 disabled:opacity-50"
              >
                Registrar entrada
              </button>
            )}
            <button
              type="button"
              onClick={continuarEscaneando}
              className="flex-1 rounded-xl border border-white/20 py-3 text-sm font-semibold text-white hover:bg-white/5"
            >
              Escanear siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function normalizeRestricciones(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x)).filter(Boolean);
  if (typeof raw === "string") return raw ? [raw] : [];
  return [];
}
