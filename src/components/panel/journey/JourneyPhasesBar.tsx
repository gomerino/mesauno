"use client";

import { JOURNEY_PHASES_UI, journeyPhaseObjective, type JourneyPhaseId } from "@/lib/journey-phases";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  phase: JourneyPhaseId;
  className?: string;
  /** p. ej. "2 de 4 listo" */
  progressPrimary?: string;
  progressHint?: string | null;
};

export function JourneyPhasesBar({
  phase,
  className = "",
  progressPrimary,
  progressHint,
}: Props) {
  const pathname = usePathname();

  return (
    <div className={`flex flex-col ${className}`}>
      <nav className="flex min-h-9 items-end gap-6" aria-label="Etapas del viaje">
        {JOURNEY_PHASES_UI.map(({ id, label, href }) => {
          const active = id === phase;
          const here = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={id}
              href={href}
              className={`relative border-b-2 pb-1 text-base font-medium transition-colors ${
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
      <p className="mt-2 text-sm text-slate-400">{journeyPhaseObjective(phase)}</p>
      {progressPrimary ? (
        <p className="mt-1 text-xs text-slate-500" aria-live="polite">
          {progressPrimary}
        </p>
      ) : null}
      {progressHint ? (
        <p className="mt-1 text-xs text-slate-500" aria-live="polite">
          {progressHint}
        </p>
      ) : null}
    </div>
  );
}
