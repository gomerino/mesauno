"use client";

import { PRICING_PLANS, type PricingPlanId } from "@/lib/pricing-plans";
import { useCallback, useState } from "react";

type Props = {
  eventoId: string;
  userEmail: string;
  prefillNombre: string;
};

function formatPriceClp(clp: number): string {
  return `$${clp.toLocaleString("es-CL")}`;
}

function readBypassFromLocation(): boolean {
  if (typeof window === "undefined") return false;
  const p = new URLSearchParams(window.location.search);
  const b = p.get("bypass");
  return b === "1" || b?.toLowerCase() === "true" || b?.toLowerCase() === "yes";
}

export function JourneyUnlockBanner({ eventoId, userEmail, prefillNombre }: Props) {
  const [plan, setPlan] = useState<PricingPlanId>("experiencia");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = useCallback(async () => {
    setError(null);
    const nombre = prefillNombre.trim();
    const email = userEmail.trim().toLowerCase();
    if (nombre.length < 2) {
      setError("Falta un nombre en tu evento. Completalo en Evento.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Necesitamos un email válido en tu cuenta.");
      return;
    }

    setBusy(true);
    try {
      const fromUrl = readBypassFromLocation();
      const qs = fromUrl ? "?bypass=1" : "";
      const res = await fetch(`/api/checkout${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          evento_id: eventoId,
          nombre,
          email,
          ...(fromUrl ? { bypass: true } : {}),
        }),
      });
      const data = (await res.json()) as {
        init_point?: string;
        error?: string;
        detail?: string;
        hint?: string;
      };
      if (!res.ok || !data.init_point) {
        const parts = [data.error, data.detail, data.hint].filter(Boolean);
        setError(parts.length ? parts.join(" ") : "No se pudo iniciar el pago.");
        return;
      }
      window.location.href = data.init_point;
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }, [eventoId, plan, prefillNombre, userEmail]);

  return (
    <div className="mb-6 rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-r from-[#D4AF37]/[0.12] via-white/[0.05] to-[#0f172a]/80 p-4 shadow-[0_0_40px_rgba(212,175,55,0.12)] backdrop-blur-md transition-all duration-500 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/90">Siguiente escala</p>
          <p className="mt-1 font-display text-lg font-semibold text-white">Desbloqueá invitaciones, música y álbum</p>
          <p className="mt-1 text-sm text-slate-400">Un solo pago con Mercado Pago. Sin salir de tu viaje.</p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex rounded-full border border-white/10 bg-black/20 p-0.5">
            {(["esencial", "experiencia"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setPlan(id)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                  plan === id
                    ? "bg-[#D4AF37]/25 text-[#D4AF37] shadow-inner"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {id === "experiencia" ? "Experiencia" : "Básico"}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void checkout()}
            className="inline-flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-5 py-2 text-[#0f172a] shadow-lg transition hover:brightness-110 disabled:opacity-60 sm:min-h-[48px] sm:py-2.5"
          >
            {busy ? (
              <span className="text-sm font-semibold">Abriendo Mercado Pago…</span>
            ) : (
              <>
                <span className="text-sm font-semibold">Activar tu viaje ✈️</span>
                <span className="text-[11px] font-medium opacity-90">
                  {plan === "experiencia"
                    ? `Experiencia ✨ ${formatPriceClp(PRICING_PLANS.experiencia.priceClp)}`
                    : `Básico ${formatPriceClp(PRICING_PLANS.esencial.priceClp)}`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
      {error ? (
        <p className="mt-3 text-xs text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
