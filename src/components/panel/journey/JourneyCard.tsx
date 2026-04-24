"use client";

import { JourneyMissionStrip } from "@/components/panel/journey/JourneyMissionStrip";
import type { JourneyMissionStep, MissionStripProps } from "@/components/panel/journey/journey-mission-types";
import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import clsx from "clsx";

export type JourneyCardStatus = "active" | "locked" | "completed";

export type { JourneyMissionStep, JourneyMissionStepState } from "@/components/panel/journey/journey-mission-types";

type Props = {
  title: string;
  description: string;
  icon: ReactNode;
  status: JourneyCardStatus;
  href?: string;
  /** Foco por etapa: borde oro discreto y leve degradado (sin glow fuerte). */
  phaseHighlight?: boolean;
  /** Micro CTA visible bajo la descripción cuando la card es navegable. */
  ctaLabel?: string;
  /** Pulso de atención (ej. al volver desde sub-pantalla con `focus=...`). */
  pulse?: boolean;
  /** CTA principal: borde + brillo/teal leve permanente (misión invitados prioritaria). */
  primaryIntent?: boolean;
  /** Callback opcional al navegar (analytics). No bloquea la navegación. */
  onNavigate?: () => void;
  /** Resumen de misiones del viaje o invitados. */
  missionStrip?: MissionStripProps;
  /** Primera misión con trabajo pendiente: card más legible (home del panel). */
  spotlight?: boolean;
};

export function JourneyCard({
  title,
  description,
  icon,
  status,
  href,
  phaseHighlight,
  ctaLabel,
  pulse,
  onNavigate,
  missionStrip,
  spotlight = false,
  primaryIntent = false,
}: Props) {
  const base = `group relative flex h-full min-h-[10.75rem] w-full min-w-0 flex-col overflow-hidden rounded-2xl border p-4 transition-[opacity,transform,border-color,box-shadow] duration-300 ease-out sm:min-h-[10.25rem] ${
    missionStrip ? "md:min-h-[15rem]" : "md:min-h-[11rem]"
  }`;

  const glass = "border-white/[0.09] bg-white/[0.05] backdrop-blur-md";

  const glow =
    status === "completed"
      ? "border-emerald-400/30 hover:border-emerald-300/45"
      : status === "active"
        ? "border-[#D4AF37]/25 hover:border-[#D4AF37]/40"
        : "border-slate-600/40";

  const phaseFocus =
    "border-teal-400/40 bg-gradient-to-b from-transparent to-teal-400/5 hover:border-teal-400/55";

  const spotlightActive =
    spotlight && status !== "locked" && status !== "completed"
      ? "border-teal-300/50 bg-gradient-to-b from-white/[0.12] to-white/[0.05] shadow-[0_0_32px_rgba(232,154,30,0.2),0_0_0_1px_rgba(255,255,255,0.1)]"
      : "";

  const surface =
    spotlight && status !== "locked" && status !== "completed"
      ? clsx(glass, spotlightActive)
      : phaseHighlight
        ? `${glass} ${phaseFocus}`
        : `${glass} ${glow}`;

  const hierarchy =
    spotlight && status !== "locked" && status !== "completed"
      ? "opacity-100"
      : phaseHighlight === true
        ? ""
        : "opacity-70 hover:opacity-100";

  const pulseRing = pulse
    ? "ring-2 ring-teal-400/50 shadow-[0_0_30px_rgba(232,154,30,0.28)] animate-pulse"
    : "";

  const ctaTone =
    status === "completed"
      ? {
          label: "text-emerald-200/90 group-hover:text-emerald-100",
          arrow: "text-emerald-300",
          divider: "border-emerald-400/15",
        }
      : phaseHighlight
        ? {
            label: "text-teal-200/90 group-hover:text-teal-100",
            arrow: "text-teal-300",
            divider: "border-teal-400/15",
          }
        : {
            label: "text-[#E6C86B] group-hover:text-[#F5D97A]",
            arrow: "text-[#D4AF37]",
            divider: "border-[#D4AF37]/15",
          };

  const inner = (
    <>
      <div className="relative z-[1] flex flex-1 flex-col">
        <div
          className={`mb-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-lg transition-transform duration-300 group-hover:scale-[1.02] md:mb-2.5 md:h-10 md:w-10 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:shrink-0 md:[&_svg]:h-[1.35rem] md:[&_svg]:w-[1.35rem] ${status === "locked" ? "opacity-80" : ""}`}
        >
          {icon}
        </div>
        <h3 className="font-display text-base font-semibold text-white">{title}</h3>
        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-400 max-sm:line-clamp-3 sm:min-h-[2.75rem]">
          {description}
        </p>

        {missionStrip ? <JourneyMissionStrip {...missionStrip} /> : null}

        {ctaLabel && status !== "locked" && href ? (
          <div
            className={`mt-auto flex items-center justify-between border-t border-dashed ${ctaTone.divider} pt-2.5 max-sm:pt-2`}
          >
          <span
            className={`min-w-0 flex-1 pr-2 text-left font-display text-[10px] font-semibold uppercase leading-snug tracking-[0.18em] transition-colors max-sm:tracking-[0.14em] ${ctaTone.label}`}
          >
            {ctaLabel}
          </span>
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] transition-all duration-300 group-hover:translate-x-0.5 group-hover:border-white/25 group-hover:bg-white/[0.12] ${ctaTone.arrow}`}
            aria-hidden
          >
            <ArrowRight
              className={primaryIntent ? "h-3.5 w-3.5" : "h-3 w-3"}
              strokeWidth={2.25}
            />
          </span>
        </div>
        ) : null}
      </div>

      {status === "locked" ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#030712]/70 px-4 text-center backdrop-blur-sm transition-opacity duration-300"
          aria-hidden
        >
          <Lock className="h-6 w-6 text-slate-100/80" strokeWidth={2} />
          <span className="text-[11px] font-medium text-slate-200">Disponible al activar tu viaje</span>
        </div>
      ) : null}

      {status === "completed" ? (
        <div
          className="absolute right-3 top-3 z-[11] flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/20 text-[10px] text-emerald-200"
          aria-hidden
        >
          ✓
        </div>
      ) : null}
    </>
  );

  const primaryGlow = primaryIntent && status === "active" ? "jurnex-card-primary-intent" : "";

  const shellClass = `${base} ${surface} ${hierarchy} ${pulseRing} ${primaryGlow}`.trim();

  if (status === "locked" || !href) {
    return <div className={shellClass}>{inner}</div>;
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`${shellClass} focus:outline-none focus-visible:ring-2 ${
        phaseHighlight ? "focus-visible:ring-teal-400/35" : "focus-visible:ring-[#D4AF37]/40"
      }`}
    >
      {inner}
    </Link>
  );
}
