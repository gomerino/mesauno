"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export type JourneyCardStatus = "active" | "locked" | "completed";

type Props = {
  title: string;
  description: string;
  icon: ReactNode;
  status: JourneyCardStatus;
  href?: string;
  /** Foco por etapa: borde teal discreto y leve degradado (sin glow fuerte). */
  phaseHighlight?: boolean;
};

export function JourneyCard({ title, description, icon, status, href, phaseHighlight }: Props) {
  const base =
    "group relative overflow-hidden rounded-2xl border p-4 transition-[opacity,transform,border-color] duration-300 ease-out";

  const glass =
    "border-white/[0.09] bg-white/[0.05] backdrop-blur-md";

  const glow =
    status === "completed"
      ? "border-emerald-400/30 hover:border-emerald-300/45"
      : status === "active"
        ? "border-[#D4AF37]/25 hover:border-[#D4AF37]/40"
        : "border-slate-600/40";

  const phaseFocus =
    "border-teal-400/40 bg-gradient-to-b from-transparent to-teal-400/5 hover:border-teal-400/55";

  const surface = phaseHighlight ? `${glass} ${phaseFocus}` : `${glass} ${glow}`;

  const hierarchy =
    phaseHighlight === true ? "" : "opacity-70 hover:opacity-100";

  const inner = (
    <>
      <div
        className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-lg transition-transform duration-300 group-hover:scale-[1.02] md:mb-2.5 md:h-10 md:w-10 md:text-xl ${status === "locked" ? "opacity-80" : ""}`}
      >
        {icon}
      </div>
      <h3 className="font-display text-base font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{description}</p>

      {status === "locked" ? (
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#030712]/70 px-4 text-center backdrop-blur-sm transition-opacity duration-300"
          aria-hidden
        >
          <Lock className="h-6 w-6 text-slate-100/80" strokeWidth={2} />
          <span className="text-[11px] font-medium text-slate-200">Disponible al activar tu viaje</span>
        </div>
      ) : null}

      {status === "completed" ? (
        <div
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/20 text-[10px] text-emerald-200"
          aria-hidden
        >
          ✓
        </div>
      ) : null}
    </>
  );

  const shellClass = `${base} ${surface} ${hierarchy}`;

  if (status === "locked" || !href) {
    return <div className={shellClass}>{inner}</div>;
  }

  return (
    <Link
      href={href}
      className={`${shellClass} block focus:outline-none focus-visible:ring-2 ${
        phaseHighlight ? "focus-visible:ring-teal-400/35" : "focus-visible:ring-[#D4AF37]/40"
      }`}
    >
      {inner}
    </Link>
  );
}
