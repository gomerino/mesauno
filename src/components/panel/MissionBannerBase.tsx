"use client";

import type { ReactNode } from "react";

type Props = {
  /** Etiqueta corta encima del título, ej. "Misión activa". */
  kicker?: string;
  /** Título principal del banner (ej. "Misión Evento"). */
  title: string;
  /** Mensaje corto con la intención (qué completar). */
  message: ReactNode;
  /** Acción secundaria opcional (ej. botón "Volver al panel"). */
  action?: ReactNode;
  /** `premium`: oro + navy alineado al panel; `default`: teal journey. */
  variant?: "default" | "premium";
  /** Clases extra para el wrapper externo. */
  className?: string;
};

/**
 * Banner base para contextos de misión dentro del panel.
 * Lo usan `MissionContextBanner` y `GuestsMissionContextClient` para mantener
 * un solo lenguaje visual y copy (título, kicker, tonos teal).
 */
export function MissionBannerBase({
  kicker = "Misión activa",
  title,
  message,
  action,
  variant = "default",
  className = "",
}: Props) {
  const inner =
    variant === "premium"
      ? "rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#0a1628] via-teal-950/25 to-[#D4AF37]/[0.1] px-4 py-4 text-sm text-slate-200 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset] sm:px-5 sm:py-4"
      : "rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-50";

  const kickerCls =
    variant === "premium"
      ? "font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]/90"
      : "font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-200/90";

  const messageCls = variant === "premium" ? "mt-1 text-slate-300" : "mt-1 text-teal-100/90";

  return (
    <div className={`mt-4 space-y-3 ${className}`.trim()}>
      <div className={inner}>
        <p className={kickerCls}>{kicker}</p>
        <p className="mt-1 font-medium text-white">{title}</p>
        <div className={messageCls}>{message}</div>
      </div>
      {action}
    </div>
  );
}
