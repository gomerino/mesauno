"use client";

import type { EventoFoto } from "@/types/database";
import { SoftAviationCountdown } from "./SoftAviationCountdown";

type Props = {
  tituloNovios: string;
  fechaEvento: string | null;
  horaEmbarque: string;
  portadaFotos: EventoFoto[];
  /** Menos altura para que el boarding pass quepa sin scroll en móvil. */
  compact?: boolean;
};

export function SoftAviationHero({
  tituloNovios,
  fechaEvento,
  horaEmbarque,
  portadaFotos: _portadaFotos,
  compact = false,
}: Props) {
  return (
    <header className="shrink-0 bg-[#D4AF37] text-[#1A2B48]">
      <div
        className={
          compact
            ? "px-2.5 pb-1.5 pt-[max(0.2rem,env(safe-area-inset-top))] sm:px-3 sm:pb-2"
            : "px-3 pb-2 pt-[max(0.3rem,env(safe-area-inset-top))] sm:px-3.5 sm:pb-2"
        }
      >
        <p
          className={`font-semibold uppercase text-[#1A2B48]/70 ${compact ? "text-[6px] tracking-[0.18em]" : "text-[6.5px] tracking-[0.2em] sm:text-[7px]"}`}
        >
          Tripulación
        </p>
        <h1
          className={`max-w-lg font-inviteSerif font-semibold leading-[1.15] text-[#1A2B48] ${
            compact
              ? "mt-0.5 text-[clamp(0.85rem,3.6vw,1.1rem)]"
              : "mt-0.5 text-[clamp(0.95rem,3.8vw,1.2rem)] sm:mt-0.5"
          }`}
        >
          {tituloNovios}
        </h1>
        <SoftAviationCountdown
          fechaEvento={fechaEvento}
          horaEmbarque={horaEmbarque}
          variant="headerMono"
          dense
        />
      </div>
    </header>
  );
}
