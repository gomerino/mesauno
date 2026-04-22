"use client";

import { createClient } from "@/lib/supabase/client";
import { PRICING_PLANS, PRICING_PLAN_STORAGE_KEY, type PricingPlanId } from "@/lib/pricing-plans";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  eventId: string;
  prefillNombre?: string;
  prefillEmail?: string;
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

export function OnboardingPaywallModal({ open, onClose, eventId, prefillNombre, prefillEmail }: Props) {
  const [selected, setSelected] = useState<PricingPlanId>("experiencia");
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
    setError(null);
    setNombre(prefillNombre?.trim() ?? "");
    setEmail(prefillEmail?.trim() ?? "");
  }, [open, prefillNombre, prefillEmail]);

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

  const ctaText = useMemo(() => {
    if (selected === "experiencia") {
      return `Activar viaje completo ✨ – ${formatPriceClp(PRICING_PLANS.experiencia.priceClp)}`;
    }
    return `Activar viaje esencial – ${formatPriceClp(PRICING_PLANS.esencial.priceClp)}`;
  }, [selected]);

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

    try {
      localStorage.setItem(PRICING_PLAN_STORAGE_KEY, selected);
    } catch {
      /* ignore */
    }

    setBusy(true);
    try {
      const fromUrl = readBypassFromLocation();
      const qs = fromUrl ? "?bypass=1" : "";
      const res = await fetch(`/api/checkout${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selected,
          evento_id: eventId.trim() || undefined,
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
  }, [email, nombre, selected, eventId]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[6000] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onb-paywall-title"
    >
      <button type="button" className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" aria-label="Cerrar" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#0f172a] to-[#020617] p-6 shadow-2xl sm:p-8">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-jurnex-secondary/85">
          Jurnex
        </p>
        <h2 id="onb-paywall-title" className="mt-2 text-center font-display text-xl font-bold text-white sm:text-2xl">
          Activa tu viaje <span aria-hidden>✈️</span>
        </h2>

        <p className="mt-4 text-center text-sm leading-relaxed text-slate-300">
          Desbloqueá la experiencia completa para tus invitados
        </p>

        <div
          className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4"
          role="radiogroup"
          aria-label="Elige tu plan"
        >
          <button
            type="button"
            role="radio"
            aria-checked={selected === "esencial"}
            onClick={() => setSelected("esencial")}
            className={[
              "relative rounded-xl p-4 text-left transition-all duration-300 ease-out",
              selected === "esencial"
                ? "border-2 border-[#D4AF37]/55 bg-white/[0.06] shadow-[0_12px_40px_rgba(212,175,55,0.08)] ring-1 ring-[#D4AF37]/25"
                : "border border-white/10 bg-white/[0.04] hover:border-white/18",
            ].join(" ")}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Básico</p>
            <p className="mt-1 font-display text-lg font-bold text-white">{PRICING_PLANS.esencial.name}</p>
            <p className="mt-1 text-lg font-bold text-[#D4AF37] transition-opacity duration-300">{PRICING_PLANS.esencial.priceLabel}</p>
            <ul className="mt-3 space-y-1.5 text-left text-xs text-slate-400">
              {PRICING_PLANS.esencial.features.slice(0, 3).map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={selected === "experiencia"}
            onClick={() => setSelected("experiencia")}
            className={[
              "relative rounded-xl p-4 pb-5 text-left transition-all duration-300 ease-out",
              selected === "experiencia"
                ? "border-2 border-[#D4AF37] bg-[#D4AF37]/[0.09] shadow-[0_0_36px_rgba(212,175,55,0.22),0_12px_40px_rgba(212,175,55,0.12)] ring-1 ring-[#D4AF37]/45"
                : "border border-[#D4AF37]/25 bg-[#D4AF37]/[0.04] hover:border-[#D4AF37]/40",
            ].join(" ")}
          >
            <div className="absolute -top-2.5 left-1/2 z-[1] -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0f172a] shadow-md">
              Más elegido
            </div>
            <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">Premium</p>
            <p className="mt-1 font-display text-lg font-bold text-white">{PRICING_PLANS.experiencia.name}</p>
            <p className="mt-1 text-lg font-bold text-[#D4AF37] transition-opacity duration-300">{PRICING_PLANS.experiencia.priceLabel}</p>
            <ul className="mt-3 space-y-1.5 text-left text-xs text-slate-300">
              {PRICING_PLANS.experiencia.features.slice(0, 3).map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <label htmlFor="onb-paywall-nombre" className="block text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37]/85">
              Nombre
            </label>
            <input
              id="onb-paywall-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="name"
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#0f172a]/90 px-3 py-2.5 text-sm text-white placeholder:text-slate-600"
              placeholder="Tu nombre o pareja"
            />
          </div>
          <div>
            <label htmlFor="onb-paywall-email" className="block text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37]/85">
              Email
            </label>
            <input
              id="onb-paywall-email"
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
          className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-4 text-center text-sm font-semibold text-[#0f172a] shadow-lg transition-all duration-300 ease-out hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
          onClick={() => void handleCheckout()}
        >
          <span key={ctaText} className="inline-block animate-fadeIn">
            {busy ? "Abriendo Mercado Pago…" : ctaText}
          </span>
        </button>

        <button
          type="button"
          className="mt-2 w-full py-2 text-center text-[11px] font-normal text-slate-600 transition-colors hover:text-slate-500"
          onClick={onClose}
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
