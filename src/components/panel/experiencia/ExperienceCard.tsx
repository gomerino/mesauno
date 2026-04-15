"use client";

import { Lock } from "lucide-react";
import type { ReactNode } from "react";

export type ExperienceCardStatus = "active" | "locked";

type Props = {
  title: string;
  description: string;
  icon: ReactNode;
  status: ExperienceCardStatus;
  /** Contenido extra bajo la descripción (p. ej. CTA). Solo tiene sentido con `active`. */
  children?: ReactNode;
};

export function ExperienceCard({ title, description, icon, status, children }: Props) {
  const isLocked = status === "locked";

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ease-out ${
        isLocked
          ? "border-white/[0.07] bg-white/[0.03]"
          : "border-white/[0.1] bg-white/[0.06] shadow-[0_12px_48px_rgba(0,0,0,0.35)] hover:-translate-y-1 hover:border-[#D4AF37]/25 hover:shadow-[0_20px_56px_rgba(212,175,55,0.12)]"
      } backdrop-blur-xl`}
    >
      <div className={`relative p-5 sm:p-6 ${isLocked ? "pointer-events-none select-none" : ""}`}>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-2xl shadow-inner transition-transform duration-300 group-hover:scale-[1.03]">
          {icon}
        </div>
        <h2 className="font-display text-lg font-semibold text-white sm:text-xl">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>

        {!isLocked && children ? (
          <div className="mt-5 transition-opacity duration-300">{children}</div>
        ) : null}
      </div>

      {isLocked ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#050810]/75 px-6 text-center backdrop-blur-md">
          <Lock className="h-7 w-7 text-[#D4AF37]/75" strokeWidth={1.75} aria-hidden />
          <p className="max-w-[220px] text-sm font-medium leading-snug text-slate-200">
            Disponible al activar tu viaje
          </p>
        </div>
      ) : null}
    </div>
  );
}
