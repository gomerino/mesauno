"use client";

import { SoftAviationCountdown } from "@/components/themes/soft-aviation/SoftAviationCountdown";

type Props = {
  tituloNovios: string;
  fechaEvento: string | null;
  horaEmbarque: string;
  fechaLegible: string | null;
};

/**
 * Hero principal del inicio del panel: invitación con nombres, fecha y cuenta regresiva (Jurnex).
 * Sangra al ancho útil (-mx-6) respecto al contenedor estrecho del panel.
 */
export function PanelInviteHero({ tituloNovios, fechaEvento, horaEmbarque, fechaLegible }: Props) {
  return (
    <header
      className="relative -mx-6 mb-1.5 shrink-0 overflow-hidden rounded-b-2xl border-b border-white/10 bg-gradient-to-br from-jurnex-bg via-[#0f172a] to-teal-950/40 text-white shadow-[0_8px_28px_rgba(0,0,0,0.35)] sm:mb-2 md:-mx-6 md:mb-2.5"
      aria-label="Matrimonio"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_65%_at_100%_-20%,rgba(20,184,166,0.24),transparent_60%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_0%_100%,rgba(245,196,81,0.09),transparent_55%)]"
        aria-hidden
      />
      <div className="relative px-5 pb-3 pt-1.5 sm:px-6 sm:pb-3.5 sm:pt-2 md:pb-4 md:pt-2.5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-teal-300/90 sm:text-[10px]">
          Matrimonio
        </p>
        <h1 className="font-display mt-1.5 max-w-3xl text-[clamp(1.2rem,4.2vw,2.1rem)] font-semibold leading-[1.15] tracking-tight text-white">
          {tituloNovios}
        </h1>
        {fechaLegible ? (
          <p className="mt-1.5 max-w-2xl text-sm capitalize leading-snug text-jurnex-text-secondary md:text-[0.95rem]">
            {fechaLegible}
          </p>
        ) : null}
        <SoftAviationCountdown
          fechaEvento={fechaEvento}
          horaEmbarque={horaEmbarque}
          variant="jurnexPanel"
        />
      </div>
    </header>
  );
}
