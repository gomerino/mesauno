"use client";

import { Check } from "lucide-react";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

const benefits = [
  "Invitados ilimitados",
  "Check-in con QR",
  "Música y fotos",
  "Gestión de mesas",
] as const;

export function PaywallModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[6000] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="paywall-title">
      <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" aria-label="Cerrar" onClick={onClose} />
      <div className="relative w-full max-w-md animate-fadeIn rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#0f172a] to-[#020617] p-6 shadow-2xl sm:p-8">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/85">Dreams Wedding</p>
        <h2 id="paywall-title" className="mt-2 text-center font-display text-xl font-bold text-white sm:text-2xl">
          Estás listo para invitar <span aria-hidden>✈️</span>
        </h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-slate-300">
          Activa tu evento para enviar tu invitación a tus invitados
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
        <button
          type="button"
          className="mt-6 w-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] py-3 text-sm font-semibold text-[#0f172a] transition hover:brightness-110 active:scale-[0.99]"
          onClick={() => {
            /* mock: aquí irá checkout / Mercado Pago */
            onClose();
          }}
        >
          Activar evento
        </button>
        <button type="button" className="mt-3 w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-300" onClick={onClose}>
          Ahora no
        </button>
      </div>
    </div>
  );
}
