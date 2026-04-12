"use client";

import type { EventoFoto } from "@/types/database";
import { SoftAviationCountdown } from "./SoftAviationCountdown";

type Props = {
  tituloNovios: string;
  fechaEvento: string | null;
  horaEmbarque: string;
  portadaFotos: EventoFoto[];
  /** Fecha en texto largo (orden: nombres → fecha → cuenta regresiva). */
  fechaLegible: string | null;
  /** Menos altura para que el boarding pass quepa sin scroll en móvil. */
  compact?: boolean;
};

export function SoftAviationHero({
  tituloNovios,
  fechaEvento,
  horaEmbarque,
  fechaLegible,
  portadaFotos: _portadaFotos,
  compact = false,
}: Props) {
  return (
    <header className="relative shrink-0 overflow-hidden border-b-2 border-[#1A2B48]/14 bg-gradient-to-br from-[#F4F1EA] via-[#E8DFD0] to-[#D4AF37] text-[#1A2B48] shadow-[0_8px_32px_rgba(26,43,72,0.12)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_100%_-10%,rgba(212,175,55,0.48),transparent_58%)]"
        aria-hidden
      />
      <div
        className={
          compact
            ? "relative px-2.5 pb-1.5 pt-[max(0.2rem,env(safe-area-inset-top))] sm:px-3 sm:pb-2"
            : "relative px-3 pb-2 pt-[max(0.3rem,env(safe-area-inset-top))] sm:px-3.5 sm:pb-2"
        }
      >
        <p
          className={`font-semibold uppercase text-[#1A2B48]/72 ${compact ? "text-[6px] tracking-[0.18em]" : "text-[6.5px] tracking-[0.2em] sm:text-[7px]"}`}
        >
          Invitación
        </p>
        <h1
          className={`max-w-lg font-inviteSerif font-semibold leading-[1.15] text-[#1A2B48] ${
            compact
              ? "mt-0.5 text-[clamp(0.9rem,3.8vw,1.15rem)]"
              : "mt-0.5 text-[clamp(1rem,4vw,1.3rem)] sm:mt-0.5"
          }`}
        >
          {tituloNovios}
        </h1>
        {fechaLegible ? (
          <p
            className={`mt-1 max-w-lg capitalize text-[#1A2B48]/88 ${compact ? "text-[10px] font-medium leading-snug sm:text-[11px]" : "text-[11px] font-semibold leading-snug sm:text-xs"}`}
          >
            {fechaLegible}
          </p>
        ) : null}
        <p
          className={`mt-1 max-w-lg font-inviteMono text-[#1A2B48]/58 ${compact ? "text-[7px] leading-snug tracking-[0.04em]" : "text-[7.5px] leading-snug tracking-[0.05em] sm:text-[8px]"}`}
        >
          Papel fino y pase en el celular.
        </p>
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
