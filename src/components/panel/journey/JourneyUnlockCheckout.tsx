"use client";

import { PRICING_PLANS, type PricingPlanId } from "@/lib/pricing-plans";
import { useCallback, useState } from "react";

export type JourneyUnlockCheckoutProps = {
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

/**
 * Selector de plan + checkout Mercado Pago (misma lógica que siempre).
 * UI: selector discreto; CTA único foco visual (precio integrado en el botón).
 */
export function JourneyUnlockCheckout({ eventoId, userEmail, prefillNombre }: JourneyUnlockCheckoutProps) {
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

  const price = PRICING_PLANS[plan].priceClp;
  const ctaLine =
    plan === "experiencia"
      ? `Activar experiencia · ${formatPriceClp(price)}`
      : `Activar plan básico · ${formatPriceClp(price)}`;

  const planToggle = (
    <div
      role="group"
      aria-label="Elegir plan"
      className="flex w-full rounded-full border border-white/[0.07] bg-black/45 p-0.5 lg:w-auto lg:shrink-0"
    >
      {(["esencial", "experiencia"] as const).map((id) => {
        const on = plan === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setPlan(id)}
            className={`min-w-0 flex-1 rounded-full px-2 py-1.5 text-[11px] transition-all duration-150 ease-out lg:flex-initial lg:px-2.5 ${
              on
                ? "bg-white/[0.07] font-medium text-slate-200 ring-1 ring-white/[0.14]"
                : "text-slate-600 hover:bg-white/[0.035] hover:text-slate-500"
            } `}
          >
            {id === "experiencia" ? "Experiencia" : "Básico"}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-end lg:gap-5">
        {planToggle}
        <div
          key={plan}
          className="flex w-full flex-col motion-safe:animate-planCtaSync motion-reduce:animate-none lg:w-auto lg:items-end"
        >
          <button
            type="button"
            disabled={busy}
            onClick={() => void checkout()}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#e0c356] via-[#D4AF37] to-[#b8941f] px-4 py-2.5 text-sm font-semibold text-[#0f172a] shadow-[0_4px_22px_-4px_rgba(212,175,55,0.42)] ring-1 ring-yellow-300/35 transition hover:brightness-[1.07] disabled:opacity-60 sm:px-5 lg:min-h-[44px] lg:min-w-[13rem] lg:px-6"
          >
            {busy ? (
              <span>Abriendo Mercado Pago…</span>
            ) : (
              <span className="max-w-[20rem] text-center tabular-nums leading-snug transition-opacity duration-150 sm:max-w-none">
                {ctaLine}
              </span>
            )}
          </button>
        </div>
      </div>
      {error ? (
        <p className="text-xs text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
