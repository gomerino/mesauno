"use client";

import { useState } from "react";

type Props = {
  invitadoId: string;
  initialRestricciones: string | null;
  initialEstado: string | null;
  /** Layout más denso (pantalla invitación junto al boarding pass). */
  compact?: boolean;
};

function estadoInicial(s: string | null): "confirmado" | "declinado" | "pendiente" {
  if (s === "declinado") return "declinado";
  if (s === "confirmado") return "confirmado";
  return "pendiente";
}

export function RSVPForm({ invitadoId, initialRestricciones, initialEstado, compact = false }: Props) {
  const [restricciones, setRestricciones] = useState(initialRestricciones ?? "");
  const [estado, setEstado] = useState<"confirmado" | "declinado" | "pendiente">(
    estadoInicial(initialEstado)
  );
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitadoId,
          restricciones_alimenticias: restricciones.trim() || null,
          rsvp_estado: estado,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setMsg("¡Listo! Tu confirmación y restricciones se guardaron.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  const card = compact
    ? "flex h-full min-h-0 flex-col rounded-lg border border-gray-200 bg-white p-2 shadow-[0_2px_12px_rgba(0,0,0,0.05)] sm:p-2.5"
    : "flex h-full min-h-0 flex-col rounded-xl border border-gray-200 bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)] sm:p-4";
  const labelSm = "text-[10px] font-semibold uppercase tracking-wide text-gray-500";
  const inputBase =
    "mt-1.5 w-full min-h-0 flex-1 rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-900 outline-none ring-[#001d66] placeholder:text-gray-400 focus:border-[#001d66] focus:ring-1";
  const gridGap = compact ? "gap-2 lg:grid-cols-3 lg:gap-3" : "gap-3 lg:grid-cols-3 lg:gap-4";
  const restriccionesRows = compact ? 3 : 5;

  return (
    <form onSubmit={onSubmit} className={`flex flex-col ${compact ? "gap-2" : "gap-3"}`}>
      <div className={`grid grid-cols-1 ${gridGap}`}>
        <div className={card}>
          <p className={labelSm}>1 · Asistencia</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-600">
            ¿Nos acompañas?
          </p>
          <div className="mt-2 flex min-h-0 flex-1 flex-col gap-1.5">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 has-[:checked]:border-[#001d66] has-[:checked]:bg-[#001d66]/5">
              <input
                type="radio"
                name="rsvp"
                checked={estado === "confirmado"}
                onChange={() => setEstado("confirmado")}
                className="h-3.5 w-3.5 shrink-0 accent-[#001d66]"
              />
              <span className="text-xs font-medium leading-tight text-gray-900">Sí, asisto</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 has-[:checked]:border-[#001d66] has-[:checked]:bg-[#001d66]/5">
              <input
                type="radio"
                name="rsvp"
                checked={estado === "declinado"}
                onChange={() => setEstado("declinado")}
                className="h-3.5 w-3.5 shrink-0 accent-[#001d66]"
              />
              <span className="text-xs font-medium leading-tight text-gray-900">No podré</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 has-[:checked]:border-[#001d66] has-[:checked]:bg-[#001d66]/5">
              <input
                type="radio"
                name="rsvp"
                checked={estado === "pendiente"}
                onChange={() => setEstado("pendiente")}
                className="h-3.5 w-3.5 shrink-0 accent-[#001d66]"
              />
              <span className="text-xs font-medium leading-tight text-gray-900">Aún no sé</span>
            </label>
          </div>
        </div>

        <div className={`${card} ${compact ? "lg:max-h-[200px]" : "lg:max-h-[220px]"}`}>
          <p className={labelSm}>2 · Restricciones</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-600">
            Alergias o preferencias, separadas por comas.
          </p>
          <textarea
            value={restricciones}
            onChange={(e) => setRestricciones(e.target.value)}
            rows={restriccionesRows}
            placeholder="Ej: vegetariano, sin mariscos…"
            className={`${inputBase} ${compact ? "max-h-[100px]" : "max-h-[140px]"} resize-none text-xs leading-snug`}
          />
        </div>

        <div className={`${card} min-w-0`}>
          <p className={labelSm}>3 · Fondo de Millas</p>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-600 sm:text-[11px] sm:leading-snug">
            Ya tenemos el hogar de nuestros sueños, ¡pero si quieres hacernos un regalo, puedes realizar una transferencia para nuestra próxima aventura!
          </p>
          <div className="mt-2.5 min-w-0 overflow-hidden rounded-lg border border-[#001d66]/20 bg-[#001d66]/[0.06] px-3 py-2 sm:px-3 sm:py-2.5">
            <dl className="divide-y divide-[#001d66]/15">
              <div className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:py-2">
                <dt className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Cuenta corriente
                </dt>
                <dd className="min-w-0 font-mono text-sm font-semibold tabular-nums tracking-wide text-gray-900 sm:max-w-[58%] sm:text-right sm:text-[13px]">
                  53-17217-05
                </dd>
              </div>
              <div className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:py-2">
                <dt className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Banco
                </dt>
                <dd className="min-w-0 text-sm font-medium leading-snug text-gray-900 sm:max-w-[58%] sm:text-right sm:text-[13px]">
                  Banco de Chile
                </dd>
              </div>
              <div className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:py-2">
                <dt className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  RUT
                </dt>
                <dd className="min-w-0 font-mono text-sm font-semibold tabular-nums text-gray-900 sm:max-w-[58%] sm:text-right sm:text-[13px]">
                  13.468.424-0
                </dd>
              </div>
              <div className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:py-2">
                <dt className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Nombre
                </dt>
                <dd className="min-w-0 break-words text-sm font-medium leading-snug text-gray-900 sm:max-w-[58%] sm:text-right sm:text-[13px]">
                  Claudia Ibáñez Salas
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full shrink-0 rounded-full bg-[#001d66] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#002a8c] disabled:opacity-50"
      >
        {loading ? "Guardando…" : "Guardar confirmación y restricciones"}
      </button>
    
      {msg && (
        <p
          className={`text-center text-xs ${msg.startsWith("¡") ? "text-emerald-700" : "text-orange-700"}`}
        >
          {msg}
        </p>
      )}
    </form>
  );
}
