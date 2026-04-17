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
  const progressCombined = [progressPrimary, progressHint].filter(Boolean).join(" · ");

  return (
    <div className={`flex flex-col ${className}`}>
      <nav className="flex min-h-8 items-end gap-4 md:min-h-9 md:gap-4" aria-label="Etapas del viaje">
        {JOURNEY_PHASES_UI.map(({ id, label, href }) => {
          const active = id === phase;
          const here = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={id}
              href={href}
              className={`relative border-b-2 pb-0.5 text-sm font-medium transition-colors md:pb-1 md:text-base ${
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
      <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-400 md:mt-1.5 md:line-clamp-none md:text-sm">
        {journeyPhaseObjective(phase)}
      </p>
      {progressPrimary || progressHint ? (
        <>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500 md:hidden" aria-live="polite">
            {progressCombined}
          </p>
          <div className="hidden md:block">
            {progressPrimary ? (
              <p className="mt-1 text-xs text-slate-500 md:mt-0.5" aria-live="polite">
                {progressPrimary}
              </p>
            ) : null}
            {progressHint ? (
              <p className="mt-1 text-xs text-slate-500 md:mt-0.5" aria-live="polite">
                {progressHint}
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
