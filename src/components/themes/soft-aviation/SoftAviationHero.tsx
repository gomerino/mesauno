"use client";

import { useAviationInvitacionVariant } from "@/components/themes/AviationInvitacionContext";
import type { EventoFoto } from "@/types/database";
import { SoftAviationCountdown } from "./SoftAviationCountdown";

type Props = {
  tituloNovios: string;
  fechaEvento: string | null;
  horaEmbarque: string;
  portadaFotos: EventoFoto[];
  /** Fecha en texto largo (orden: nombres → epígrafe → fecha → cuenta regresiva). */
  fechaLegible: string | null;
  /** Menos altura para que el boarding pass quepa sin scroll en móvil. */
  compact?: boolean;
  /** Primera línea de la carta; en modo compacto se muestra en una línea. */
  epigrafe?: string | null;
};

export function SoftAviationHero({
  tituloNovios,
  fechaEvento,
  horaEmbarque,
  fechaLegible,
  portadaFotos: _portadaFotos,
  compact = false,
  epigrafe = null,
}: Props) {
  const aviation = useAviationInvitacionVariant();
  const isJurnex = aviation === "jurnex";

  return (
    <header
      className={
        isJurnex
          ? "relative shrink-0 overflow-hidden border-b-2 border-inviteJurnex-navy/18 bg-gradient-to-br from-inviteJurnex-cream via-inviteJurnex-sand to-teal-500/30 text-inviteJurnex-navy shadow-[0_8px_32px_rgba(2,24,42,0.1)]"
          : "relative shrink-0 overflow-hidden border-b-2 border-invite-navy/14 bg-gradient-to-br from-invite-sand via-invite-haze to-invite-gold text-invite-navy shadow-[0_8px_32px_rgba(26,43,72,0.12)]"
      }
    >
      <div
        className={
          isJurnex
            ? "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_100%_-10%,rgba(232,154,30,0.38),transparent_58%)]"
            : "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_100%_-10%,rgba(212,175,55,0.48),transparent_58%)]"
        }
        aria-hidden
      />
      <div
        className={
          compact
            ? "relative w-full px-3 pb-1.5 pt-[max(0.2rem,env(safe-area-inset-top))] sm:px-3.5 sm:pb-2"
            : "relative w-full px-3 pb-2 pt-[max(0.3rem,env(safe-area-inset-top))] sm:px-3.5 sm:pb-2 motion-safe:animate-rsvpReveal motion-reduce:animate-none"
        }
      >
        <p
          className={`font-semibold uppercase ${isJurnex ? "text-inviteJurnex-navy/70" : "text-invite-navy/72"} ${compact ? "text-[6px] tracking-[0.18em]" : "text-[6.5px] tracking-[0.2em] sm:text-[7px]"}`}
        >
          Invitación
        </p>
        <h1
          className={`max-w-lg font-semibold leading-[1.15] ${isJurnex ? "font-display" : "font-inviteSerif"} ${isJurnex ? "text-inviteJurnex-navy" : "text-invite-navy"} ${
            compact
              ? "mt-0.5 text-[clamp(0.9rem,3.8vw,1.15rem)]"
              : "mt-0.5 text-[clamp(1rem,4vw,1.3rem)] sm:mt-0.5"
          }`}
        >
          {tituloNovios}
        </h1>
        {epigrafe ? (
          <p
            className={
              compact
                ? `mt-1 max-w-lg truncate text-[9px] italic ${isJurnex ? "text-inviteJurnex-navy/70" : "text-invite-navy/68"} sm:text-[10px]`
                : `mt-1.5 max-w-lg text-[11px] italic leading-snug sm:text-xs ${isJurnex ? "text-inviteJurnex-navy/78" : "text-invite-navy/75"}`
            }
            title={compact ? epigrafe : undefined}
          >
            {epigrafe}
          </p>
        ) : null}
        {fechaLegible ? (
          <p
            className={`mt-1 max-w-lg capitalize ${isJurnex ? "text-inviteJurnex-navy/90" : "text-invite-navy/88"} ${compact ? "text-[10px] font-medium leading-snug sm:text-[11px]" : "text-[11px] font-semibold leading-snug sm:text-xs"}`}
          >
            {fechaLegible}
          </p>
        ) : null}
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
