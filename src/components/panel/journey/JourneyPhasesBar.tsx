"use client";

import {
  JOURNEY_PHASES_UI,
  journeyPhaseMicrocopy,
  type JourneyPhaseId,
} from "@/lib/journey-phases";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  phase: JourneyPhaseId;
  /** Microcopy arriba de la fila de fases. */
  microcopyPosition?: "above" | "below";
  className?: string;
};

export function JourneyPhasesBar({ phase, microcopyPosition = "above", className = "" }: Props) {
  const pathname = usePathname();
  const micro = <p className="text-sm text-slate-400 opacity-70">{journeyPhaseMicrocopy(phase)}</p>;

  const row = (
    <nav className="flex h-8 items-end gap-6" aria-label="Etapas del viaje">
      {JOURNEY_PHASES_UI.map(({ id, label, href }) => {
        const active = id === phase;
        const here = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={id}
            href={href}
            className={`relative border-b-2 pb-0.5 text-sm font-medium transition-colors ${
              active
                ? "border-teal-400 text-white"
                : here
                  ? "border-transparent text-slate-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
            aria-current={active ? "step" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {microcopyPosition === "above" ? micro : null}
      {row}
      {microcopyPosition === "below" ? micro : null}
    </div>
  );
}
