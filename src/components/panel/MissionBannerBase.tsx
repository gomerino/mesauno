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
  /** Clases extra para el wrapper externo. */
  className?: string;
};

/**
 * Banner base para contextos de misión dentro del panel.
 * Lo usan `MissionContextBanner` y `GuestsMissionContextClient` para mantener
 * un solo lenguaje visual y copy (título, kicker, tonos teal).
 */
export function MissionBannerBase({ kicker = "Misión activa", title, message, action, className = "" }: Props) {
  return (
    <div className={`mt-4 space-y-3 ${className}`.trim()}>
      <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-50">
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-200/90">{kicker}</p>
        <p className="mt-1 font-medium text-white">{title}</p>
        <div className="mt-1 text-teal-100/90">{message}</div>
      </div>
      {action}
    </div>
  );
}
