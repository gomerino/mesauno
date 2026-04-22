"use client";

import { createClient } from "@/lib/supabase/client";
import { PRICING_PLANS, type PricingPlanId } from "@/lib/pricing-plans";
import { Check } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Evento ya creado en BD (onboarding persistido); opcional. */
  eventoId?: string;
  defaultPlan?: PricingPlanId;
  prefillNombre?: string;
  prefillEmail?: string;
};

const benefits = [
  "Invitados ilimitados",
  "Check-in con QR",
  "Música y fotos",
  "Gestión de mesas",
] as const;

function formatPriceClp(clp: number): string {
  return `$${clp.toLocaleString("es-CL")}`;
}

function readBypassFromLocation(): boolean {
  if (typeof window === "undefined") return false;
  const p = new URLSearchParams(window.location.search);
  const b = p.get("bypass");
  return b === "1" || b?.toLowerCase() === "true" || b?.toLowerCase() === "yes";
}

export function PaywallModal({
  open,
  onClose,
  eventoId,
  defaultPlan = "experiencia",
  prefillNombre,
  prefillEmail,
}: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlanId>(defaultPlan);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setSelectedPlan(defaultPlan);
    setError(null);
    setNombre(prefillNombre?.trim() ?? "");
    setEmail(prefillEmail?.trim() ?? "");
  }, [open, defaultPlan, prefillNombre, prefillEmail]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setEmail((e) => e || user.email?.trim().toLowerCase() || "");
      setNombre((n) => {
        if (n.trim().length >= 2) return n;
        const meta = user.user_metadata?.full_name;
        if (typeof meta === "string" && meta.trim().length >= 2) return meta.trim();
        const local = user.email?.split("@")[0];
        if (local && local.length >= 2) return local;
        return n;
      });
    })();
  }, [open, supabase]);

  const handleCheckout = useCallback(async () => {
    setError(null);
    const n = nombre.trim();
    const em = email.trim().toLowerCase();
    if (n.length < 2) {
      setError("Indica tu nombre (mínimo 2 caracteres).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError("Indica un email válido.");
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
          plan: selectedPlan,
          evento_id: eventoId?.trim() || undefined,
          nombre: n,
          email: em,
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
  }, [email, nombre, selectedPlan, eventoId]);

  if (!open) return null;

  const ctaPrimary =
    selectedPlan === "experiencia"
      ? `Activar viaje completo ✨ – ${formatPriceClp(PRICING_PLANS.experiencia.priceClp)}`
      : `Activar viaje esencial – ${formatPriceClp(PRICING_PLANS.esencial.priceClp)}`;

  return (
    <div
      className="fixed inset-0 z-[6000] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
    >
      <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" aria-label="Cerrar" onClick={onClose} />
      <div className="relative w-full max-w-md animate-fadeIn rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#0f172a] to-[#020617] p-6 shadow-2xl sm:p-8">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-jurnex-secondary/85">
          Jurnex
        </p>
        <h2 id="paywall-title" className="mt-2 text-center font-display text-xl font-bold text-white sm:text-2xl">
          Activa tu viaje <span aria-hidden>✈️</span>
        </h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-slate-300">
          Desbloqueá la experiencia completa para tus invitados
        </p>
        <ul className="mt-6 space-y-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2.5 text-sm text-slate-200">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
              </span>
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {(["esencial", "experiencia"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedPlan(id)}
              className={[
                "rounded-xl border px-3 py-2.5 text-left text-xs transition-all duration-200",
                selectedPlan === id
                  ? id === "experiencia"
                    ? "border-[#D4AF37] bg-[#D4AF37]/15 text-white shadow-[0_0_28px_rgba(212,175,55,0.28)] ring-1 ring-[#D4AF37]/50"
                    : "border-[#D4AF37] bg-[#D4AF37]/15 text-white shadow-[0_0_24px_rgba(212,175,55,0.15)]"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20",
              ].join(" ")}
            >
              <span className="block font-semibold text-[#D4AF37]">
                {id === "experiencia" ? "Experiencia ✨" : "Básico ✈️"}
              </span>
              <span className="mt-0.5 block text-[11px] text-slate-500">{PRICING_PLANS[id].priceLabel}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="paywall-nombre" className="block text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37]/85">
              Nombre
            </label>
            <input
              id="paywall-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="name"
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#0f172a]/90 px-3 py-2.5 text-sm text-white placeholder:text-slate-600"
              placeholder="Tu nombre o pareja"
            />
          </div>
          <div>
            <label htmlFor="paywall-email" className="block text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37]/85">
              Email
            </label>
            <input
              id="paywall-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#0f172a]/90 px-3 py-2.5 text-sm text-white placeholder:text-slate-600"
              placeholder="tu@email.com"
            />
          </div>
        </div>

        {error ? (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={busy}
          className="mt-5 w-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] py-3 text-sm font-semibold text-[#0f172a] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
          onClick={() => void handleCheckout()}
        >
          {busy ? "Abriendo Mercado Pago…" : ctaPrimary}
        </button>
        <button
          type="button"
          className="mt-2 w-full py-1.5 text-center text-[11px] font-normal text-slate-600 transition-colors hover:text-slate-500"
          onClick={onClose}
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
