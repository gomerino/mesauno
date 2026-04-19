"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

type Props = {
  proveedorId: string;
  slug: string;
  isLoggedIn: boolean;
  mostrar: boolean;
};

const RANGOS = [
  { value: "", label: "Prefiero no decir" },
  { value: "lt-500k", label: "Menos de $500.000" },
  { value: "500k-1m", label: "$500.000 – $1.000.000" },
  { value: "1m-3m", label: "$1.000.000 – $3.000.000" },
  { value: "gt-3m", label: "Más de $3.000.000" },
] as const;

export function MarketplaceSolicitudContacto({
  proveedorId,
  slug,
  isLoggedIn,
  mostrar,
}: Props) {
  const router = useRouter();
  const [mensaje, setMensaje] = useState("");
  const [rango, setRango] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  if (!mostrar) {
    return null;
  }

  const loginHref = `/login?next=${encodeURIComponent(`/marketplace/${slug}`)}`;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);
    try {
      const res = await fetch("/api/marketplace/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proveedorId,
          mensaje: mensaje.trim() || null,
          canal: "en_app",
          rangoPresupuesto: rango || null,
        }),
      });
      const json = (await res.json()) as { error?: string; limitadoPorPlan?: boolean; code?: string };
      if (!res.ok) {
        setError(json.error ?? "No se pudo enviar la solicitud.");
        return;
      }
      trackEvent("marketplace_contact_request_sent", {
        limitado_por_plan: json.limitadoPorPlan === true,
      });
      setOk(
        json.limitadoPorPlan
          ? "Recibimos tu mensaje. El profesional tiene muchas solicitudes este mes; puede tardar un poco más en responderte."
          : "Recibimos tu mensaje. El profesional podrá verlo en su panel.",
      );
      setMensaje("");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-amber-400/25 bg-amber-950/20 p-6">
      <h2 className="font-display text-lg font-semibold text-white">Solicitud de contacto</h2>
      <p className="mt-2 text-sm text-slate-400">
        Envía un mensaje breve. Necesitas una cuenta Jurnex para que podamos asociar la solicitud a tu
        evento cuando corresponda.
      </p>

      {!isLoggedIn ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <Link
            href={loginHref}
            className="font-semibold text-amber-200 underline underline-offset-2 hover:text-white"
          >
            Inicia sesión
          </Link>{" "}
          para enviar una solicitud de contacto.
        </div>
      ) : (
        <form onSubmit={enviar} className="mt-4 space-y-4">
          <div>
            <label htmlFor="mc-mensaje" className="block text-xs font-medium text-slate-500">
              Mensaje (opcional)
            </label>
            <textarea
              id="mc-mensaje"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={4}
              maxLength={2000}
              className="input-jurnex mt-1 min-h-[100px] w-full resize-y"
              placeholder="Cuéntanos qué buscas: fecha aproximada, estilo, dudas…"
            />
          </div>
          <div>
            <label htmlFor="mc-rango" className="block text-xs font-medium text-slate-500">
              Presupuesto aproximado (opcional)
            </label>
            <select
              id="mc-rango"
              value={rango}
              onChange={(e) => setRango(e.target.value)}
              className="input-jurnex mt-1 w-full"
            >
              {RANGOS.map((o) => (
                <option key={o.value || "none"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          )}
          {ok && (
            <p className="text-sm text-emerald-300" role="status">
              {ok}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-amber-300 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-60"
          >
            {loading ? "Enviando…" : "Enviar solicitud"}
          </button>
        </form>
      )}
    </section>
  );
}
