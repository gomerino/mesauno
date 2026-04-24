"use client";

import { panelProgressFill, panelProgressTrack } from "@/components/panel/ds/panel-ds-classes";
import type { MissionStripProps } from "@/components/panel/journey/journey-mission-types";
import { Lock } from "lucide-react";

export type { JourneyMissionStep, JourneyMissionStepState, MissionStripProps } from "@/components/panel/journey/journey-mission-types";

export function JourneyMissionStrip({
  steps,
  doneCount,
  totalCount,
  ariaLabel,
  noTopRule,
  hideMisionesLabel,
  compact,
}: MissionStripProps) {
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const c = (classes: { normal: string; small: string }) => (compact ? classes.small : classes.normal);

  return (
    <div
      className={
        noTopRule
          ? ""
          : c({ normal: "mt-3 border-t border-white/[0.07] pt-3", small: "mt-2 border-t border-white/[0.07] pt-2" })
      }
    >
      {hideMisionesLabel ? null : (
        <div
          className={
            c({ normal: "mb-2", small: "mb-1" }) + " flex items-center justify-between gap-2"
          }
        >
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">Progreso</span>
          <span className="tabular-nums text-[10px] font-medium text-teal-200/85">
            {doneCount}/{totalCount}
          </span>
        </div>
      )}
      {hideMisionesLabel ? (
        <p className="sr-only">
          {doneCount} de {totalCount} pasos
        </p>
      ) : null}
      <div
        className={c({
          normal: `${panelProgressTrack} mb-3`,
          small: "mb-1.5 h-0.5 w-full overflow-hidden rounded-full bg-white/10",
        })}
      >
        <div className={panelProgressFill} style={{ width: `${pct}%` }} />
      </div>
      <div
        className="flex justify-between gap-0.5 sm:gap-1"
        role="list"
        aria-label={ariaLabel ?? "Progreso del viaje"}
      >
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={c({ normal: "flex min-w-0 flex-1 flex-col items-center gap-0.5 sm:gap-1", small: "flex min-w-0 flex-1 flex-col items-center gap-0.5" })}
            role="listitem"
          >
            <span
              className={`flex items-center justify-center rounded-full border text-[8px] font-semibold transition-colors ${c({
                normal: "h-6 w-6 sm:h-7 sm:w-7 sm:text-[9px]",
                small: "h-5 w-5 sm:h-6 sm:w-6 sm:text-[8px]",
              })} ${
                s.state === "done"
                  ? "border-teal-400/40 bg-teal-500/20 text-teal-200"
                  : s.state === "active"
                    ? "border-[#F5C451]/50 bg-[#F5C451]/12 text-[#F5D97A] shadow-[0_0_14px_rgba(245,196,81,0.22)]"
                    : s.state === "locked"
                      ? "border-white/10 bg-white/[0.04] text-slate-500"
                      : "border-white/10 bg-white/[0.06] text-slate-500"
              }`}
              title={s.label}
            >
              {s.state === "locked" ? (
                <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2} aria-hidden />
              ) : s.state === "done" ? (
                "✓"
              ) : s.state === "active" ? (
                <span className="h-1.5 w-1.5 rounded-full bg-[#F5C451] sm:h-2 sm:w-2" aria-hidden />
              ) : (
                <span className="text-[9px] tabular-nums opacity-80 sm:text-[10px]">{i + 1}</span>
              )}
            </span>
            <span
              className={
                c({
                  normal:
                    "max-w-full truncate text-center text-[7px] font-medium leading-tight text-slate-500 sm:text-[8px] md:text-[9px]",
                  small: "max-w-full truncate text-center text-[6px] font-medium leading-tight text-slate-500 sm:text-[7px]",
                })
              }
            >
              {s.label}
            </span>
            {s.micro ? (
              <span
                className={c({
                  normal: `line-clamp-2 max-w-full text-center text-[6px] font-normal leading-tight sm:text-[7px] ${
                    s.state === "done"
                      ? "text-emerald-400/95"
                      : s.state === "active"
                        ? "text-amber-100/85"
                        : "text-slate-500/80"
                  }`,
                  small: `line-clamp-2 max-w-full text-center text-[5.5px] font-normal leading-tight sm:text-[6.5px] ${
                    s.state === "done"
                      ? "text-emerald-400/95"
                      : s.state === "active"
                        ? "text-amber-100/85"
                        : "text-slate-500/80"
                  }`,
                })}
              >
                {s.micro}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
