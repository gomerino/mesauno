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
  /** Foco visual según etapa del viaje (borde teal + glow suave). */
  phaseHighlight?: boolean;
};

export function JourneyCard({ title, description, icon, status, href, phaseHighlight }: Props) {
  const base =
    "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ease-out";

  const glass =
    "border-white/[0.09] bg-white/[0.05] shadow-[0_8px_40px_rgba(0,0,0,0.25)] backdrop-blur-md";

  const glow =
    status === "completed"
      ? "border-emerald-400/35 shadow-[0_0_34px_rgba(52,211,153,0.2)] hover:-translate-y-0.5 hover:border-emerald-300/55 hover:shadow-[0_14px_44px_rgba(52,211,153,0.22)]"
      : status === "active"
        ? "border-[#D4AF37]/30 shadow-[0_0_36px_rgba(212,175,55,0.16)] hover:-translate-y-1 hover:border-[#D4AF37]/55 hover:shadow-[0_16px_48px_rgba(212,175,55,0.24)]"
        : "border-slate-600/45 opacity-[0.94]";

  const phaseFocus =
    "border-teal-400/55 bg-white/[0.06] shadow-[0_0_44px_rgba(45,212,191,0.18)] ring-1 ring-teal-400/25 hover:-translate-y-0.5 hover:border-teal-300/70 hover:shadow-[0_0_52px_rgba(45,212,191,0.26)]";

  const surface = phaseHighlight ? `${glass} ${phaseFocus}` : `${glass} ${glow}`;

  const inner = (
    <>
      <div
        className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-xl transition-transform duration-300 group-hover:scale-105 ${status === "locked" ? "opacity-80" : ""}`}
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

  if (status === "locked" || !href) {
    return <div className={`${base} ${surface}`}>{inner}</div>;
  }

  return (
    <Link
      href={href}
      className={`${base} ${surface} block focus:outline-none focus-visible:ring-2 ${
        phaseHighlight ? "focus-visible:ring-teal-400/45" : "focus-visible:ring-[#D4AF37]/50"
      }`}
    >
      {inner}
    </Link>
  );
}
