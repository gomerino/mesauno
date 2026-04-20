"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  /** Una línea para el resumen colapsado en móvil (métricas clave). */
  summaryMetrics: string;
  children: ReactNode;
};

/**
 * Opción A (PM/UX): correo, WhatsApp y métricas en acordeón.
 * Móvil: cerrado por defecto con resumen; desktop (md+): abierto.
 */
export function InvitadosEnvioAccordion({ summaryMetrics, children }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const el = detailsRef.current;
    if (!el) return;
    const apply = () => {
      el.open = mq.matches;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <details
      ref={detailsRef}
      id="envio-invitaciones"
      className="group scroll-mt-28 overflow-hidden rounded-jurnex-md border border-jurnex-border/35 bg-jurnex-bg/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 sm:px-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]/90">
            Correo y seguimiento
          </p>
          <p className="mt-1 font-display text-base font-semibold text-white md:text-lg">
            Envío masivo y métricas
          </p>
          <p className="mt-1 truncate text-xs text-slate-400 md:hidden" title={summaryMetrics}>
            {summaryMetrics}
          </p>
          <p className="mt-1 hidden text-xs text-jurnex-text-muted md:block">
            WhatsApp por fila, envío de correos y tasas de apertura.
          </p>
        </div>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-jurnex-border/50 bg-jurnex-surface/30 text-jurnex-secondary/90 transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>

      <div className="space-y-4 border-t border-jurnex-border/30 px-4 py-4 sm:px-4">{children}</div>
    </details>
  );
}
