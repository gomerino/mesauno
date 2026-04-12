"use client";

import type { PricingPlanId } from "@/lib/pricing-plans";
import { PRICING_PLANS } from "@/lib/pricing-plans";
import { X } from "lucide-react";
import { useCallback, useState } from "react";

type Props = {
  open: boolean;
  planId: PricingPlanId | null;
  onClose: () => void;
};

export function CheckoutModal({ open, planId, onClose }: Props) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setNombre("");
    setEmail("");
    setError(null);
    setBusy(false);
  }, []);

  const handleClose = useCallback(() => {
    if (busy) return;
    reset();
    onClose();
  }, [busy, onClose, reset]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!planId) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/checkout/pricing-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, nombre: nombre.trim(), email: email.trim() }),
      });
      const json = (await res.json()) as {
        init_point?: string;
        error?: string;
        detail?: string;
        hint?: string;
      };
      if (!res.ok || !json.init_point) {
        const parts = [json.error, json.detail, json.hint].filter(Boolean);
        setError(parts.length ? parts.join(" ") : "No se pudo iniciar el pago. Intenta de nuevo.");
        setBusy(false);
        return;
      }
      window.location.href = json.init_point;
    } catch {
      setError("Error de red. Revisa tu conexión.");
      setBusy(false);
    }
  }

  if (!open || !planId) return null;

  const plan = PRICING_PLANS[planId];

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={handleClose}
      />
      <div className="relative z-[71] w-full max-w-md rounded-t-2xl border border-white/15 bg-gradient-to-b from-[#162032] to-[#0f172a] p-6 shadow-2xl sm:rounded-2xl sm:border-[#D4AF37]/25">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]/90">Checkout</p>
            <h2 className="mt-1 font-display text-xl font-bold text-white">{plan.name}</h2>
            <p className="mt-1 text-sm text-[#D4AF37]">{plan.priceLabel}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="checkout_nombre" className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              id="checkout_nombre"
              name="nombre"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={busy}
              className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/90 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
              placeholder="Tu nombre o el del evento"
            />
          </div>
          <div>
            <label htmlFor="checkout_email" className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              id="checkout_email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/90 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
              placeholder="tu@email.com"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] py-3 text-sm font-semibold text-[#0f172a] shadow-lg transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "Abriendo Mercado Pago…" : "Continuar al pago"}
          </button>
          <p className="text-center text-[11px] text-slate-500">
            Serás redirigido a Mercado Pago de forma segura. Pago único en CLP.
          </p>
        </form>
      </div>
    </div>
  );
}
