"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode, Ref } from "react";

export type InvitadosMesaAccordionProps = {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  headerRef?: Ref<HTMLButtonElement>;
  totalPasajeros: number;
  confirmados: number;
  pendientes: number;
  progressPct: number;
  contentId: string;
  headerId: string;
  children: ReactNode;
};

export function InvitadosMesaAccordion({
  label,
  isOpen,
  onToggle,
  headerRef,
  totalPasajeros,
  confirmados,
  pendientes,
  progressPct,
  contentId,
  headerId,
  children,
}: InvitadosMesaAccordionProps) {
  const pasajerosLabel =
    totalPasajeros === 1 ? "1 pasajero" : `${totalPasajeros} pasajeros`;

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-black/20">
      <button
        ref={headerRef}
        type="button"
        id={headerId}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={onToggle}
        className="w-full cursor-pointer text-left transition-colors duration-150 hover:bg-white/[0.02]"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-white/90">{label}</p>
            <p className="mt-1 text-xs text-white/60">{pasajerosLabel}</p>
            <p className="mt-0.5 text-xs text-white/60">
              {confirmados} confirmados · {pendientes} pendientes
            </p>
          </div>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-white/50 transition-transform duration-150 ease-out ${isOpen ? "rotate-180" : ""}`}
            aria-hidden
          />
        </div>
        <div className="px-4 pb-3" aria-hidden>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-yellow-400 transition-[width] duration-150 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-150 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="min-h-0 overflow-hidden">
          {children ? (
            <div
              id={contentId}
              role="region"
              aria-labelledby={headerId}
              className="mt-3 border-t border-white/[0.06] px-4 pb-4 pt-3"
            >
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
