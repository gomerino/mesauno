"use client";

import type { Evento } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const label = "block text-xs font-medium text-slate-400";

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const s = String(iso).trim();
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return "";
}

type Props = {
  eventoId: string;
  initial: Pick<
    Evento,
    | "recordatorios_activos"
    | "max_recordatorios"
    | "frecuencia_recordatorios"
    | "fecha_inicio_recordatorios"
  >;
};

export function RecordatoriosEventoSection({ eventoId, initial }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [activos, setActivos] = useState(Boolean(initial.recordatorios_activos));
  const [maxIns, setMaxIns] = useState(() =>
    Math.min(5, Math.max(1, initial.max_recordatorios ?? 2))
  );
  const [dias, setDias] = useState(() =>
    Math.min(10, Math.max(2, initial.frecuencia_recordatorios ?? 3))
  );
  const [fechaInicio, setFechaInicio] = useState(() => toDateInputValue(initial.fecha_inicio_recordatorios));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    setOk(false);
    const { error } = await supabase
      .from("eventos")
      .update({
        recordatorios_activos: activos,
        max_recordatorios: maxIns,
        frecuencia_recordatorios: dias,
        fecha_inicio_recordatorios: fechaInicio.trim() ? fechaInicio.trim() : null,
      })
      .eq("id", eventoId);
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setOk(true);
    router.refresh();
    setTimeout(() => setOk(false), 3000);
  }

  return (
    <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-white">Recordatorios automáticos</h2>
        <p className="mt-1 text-sm text-slate-400">
          Insistencias por correo a invitados con RSVP pendiente (solo si ya recibieron la invitación inicial). Configura
          el cron en tu hosting con <code className="text-teal-400">GET/POST /api/cron/reminders</code> y{" "}
          <code className="text-teal-400">Authorization: Bearer CRON_SECRET</code>.
        </p>
      </div>

      <form onSubmit={guardar} className="space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">Activar recordatorios</p>
            <p className="text-xs text-slate-500">Si está apagado, el cron no enviará insistencias para este evento.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={activos}
            onClick={() => setActivos((a) => !a)}
            className={`relative h-8 w-14 shrink-0 rounded-full transition ${
              activos ? "bg-teal-500" : "bg-slate-600"
            }`}
          >
            <span
              className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition ${
                activos ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div>
          <label className={label} htmlFor="fecha-inicio-recordatorios">
            Comenzar recordatorios automáticos el día…
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <input
              id="fecha-inicio-recordatorios"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-teal-500/50 focus:ring-2 [&::-webkit-calendar-picker-indicator]:invert"
            />
            {fechaInicio ? (
              <button
                type="button"
                onClick={() => setFechaInicio("")}
                className="text-xs font-medium text-slate-400 underline hover:text-slate-200"
              >
                Sin fecha (cuanto antes según cadencia)
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Los recordatorios solo se enviarán a partir de esta fecha a los invitados que aún no hayan confirmado. Si dejas el
            campo vacío, no hay aplazamiento por calendario: aplican el interruptor de arriba y la cadencia de días.
          </p>
        </div>

        <div>
          <div className="flex justify-between gap-2">
            <label className={label}>Cantidad de insistencias (máximo)</label>
            <span className="text-sm font-semibold text-teal-300">{maxIns}</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={maxIns}
            onChange={(e) => setMaxIns(Number(e.target.value))}
            className="mt-2 w-full accent-teal-500"
          />
          <p className="mt-1 text-xs text-slate-500">No incluye el primer correo de invitación; solo recordatorios.</p>
        </div>

        <div>
          <div className="flex justify-between gap-2">
            <label className={label}>Días entre avisos</label>
            <span className="text-sm font-semibold text-teal-300">{dias} días</span>
          </div>
          <input
            type="range"
            min={2}
            max={10}
            step={1}
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className="mt-2 w-full accent-teal-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            Tiempo mínimo entre el envío inicial (o el último recordatorio) y el siguiente.
          </p>
        </div>

        {err && <p className="rounded-lg bg-orange-500/20 px-3 py-2 text-sm text-orange-200">{err}</p>}
        {ok && <p className="text-sm text-teal-300">Guardado.</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-teal-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar recordatorios"}
        </button>
      </form>
    </section>
  );
}
