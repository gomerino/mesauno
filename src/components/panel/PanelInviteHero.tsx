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
      className="relative -mx-6 mb-2 shrink-0 overflow-hidden rounded-b-2xl border-b border-white/10 bg-gradient-to-br from-jurnex-bg via-[#0f172a] to-teal-950/40 text-white shadow-[0_12px_48px_rgba(0,0,0,0.45)] sm:mb-3 md:-mx-6 md:mb-4"
      aria-label="Matrimonio"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_65%_at_100%_-20%,rgba(20,184,166,0.28),transparent_60%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_0%_100%,rgba(245,196,81,0.11),transparent_55%)]"
        aria-hidden
      />
      <div className="relative px-6 pb-10 pt-2 sm:pb-12 sm:pt-4 md:pb-14 md:pt-6 lg:pb-16">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-teal-300/90 sm:text-[11px]">
          Matrimonio
        </p>
        <h1 className="font-display mt-3 max-w-3xl text-[clamp(1.5rem,5vw,2.75rem)] font-semibold leading-[1.12] tracking-tight text-white">
          {tituloNovios}
        </h1>
        {fechaLegible ? (
          <p className="mt-3 max-w-2xl text-base capitalize leading-snug text-jurnex-text-secondary md:text-lg">
            {fechaLegible}
          </p>
        ) : null}
        <SoftAviationCountdown
          fechaEvento={fechaEvento}
          horaEmbarque={horaEmbarque}
          variant="jurnexPanel"
          prominent
        />
      </div>
    </header>
  );
}
