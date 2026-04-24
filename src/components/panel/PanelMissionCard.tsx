"use client";

import type { ReactNode } from "react";

type Props = {
  /** Línea breve bajo el mismo criterio que Pasajeros / recuerdos / viaje. */
  micro: ReactNode;
  /** Típicamente `<JourneyMissionStrip ... />` */
  missionStrip: ReactNode;
  /** Resumen bajo el borde (p. ej. metas en Pasajeros) */
  footer?: ReactNode;
};

/** Marco visual compartido: misma caja que el bloque de misión en `/panel/pasajeros`. */
export function PanelMissionCard({ micro, missionStrip, footer }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-teal-400/20 bg-gradient-to-br from-teal-950/35 via-slate-950/40 to-black/50 p-[1px] shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
      <div className="rounded-2xl bg-slate-950/55 px-3 py-2.5 backdrop-blur-sm md:px-4 md:py-2.5">
        <p className="line-clamp-3 text-[10px] leading-snug text-slate-500/90">{micro}</p>
        <div className="mt-2">{missionStrip}</div>
        {footer ? (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-white/[0.08] pt-2.5 text-[10px] text-slate-500">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
