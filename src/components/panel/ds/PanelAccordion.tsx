"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  className?: string;
};

/**
 * Acordeón compacto del panel (detalles nativos, sin gradientes).
 */
export function PanelAccordion({ title, children, className = "" }: Props) {
  return (
    <details
      className={`group rounded-xl border border-white/10 bg-black/30 ${className}`.trim()}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-white/80 [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-t border-white/10 px-4 pb-3 pt-2 text-sm text-white/60">{children}</div>
    </details>
  );
}
