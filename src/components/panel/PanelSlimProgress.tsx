import Link from "next/link";
import {
  panelNextActionHref,
  panelNextActionLabel,
} from "@/lib/panel-progress-load";
import type { JourneyStepId } from "@/lib/panel-setup-progress";

type Props = {
  pct: number;
  headline: string;
  nextStep: JourneyStepId | null;
  /** Barra compacta al final en móvil. */
  variant?: "default" | "compact";
  /** En inicio del panel el CTA principal vive en `JourneyPrimaryCta`; oculta enlaces duplicados abajo. */
  footer?: "default" | "none";
};

export function PanelSlimProgress({
  pct,
  headline,
  nextStep,
  variant = "default",
  footer = "default",
}: Props) {
  const compact = variant === "compact";
  const quickHref = panelNextActionHref(nextStep);
  const quickLabel = panelNextActionLabel(nextStep);
  const showFooter = footer === "default";

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3"
          : "mb-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent px-4 py-4 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]"
      }
    >
      <div className={`flex flex-wrap items-start justify-between gap-2 ${compact ? "gap-2" : "gap-3"}`}>
        <div className="min-w-0">
          <p
            className={
              compact
                ? "text-[10px] font-semibold uppercase tracking-wide text-teal-400/60"
                : "text-xs font-semibold uppercase tracking-wide text-teal-400/60"
            }
          >
            Progreso
          </p>
          <p
            className={`text-slate-300/60 ${compact ? "mt-0.5 text-xs leading-snug" : "mt-1 text-sm leading-snug"}`}
          >
            {headline}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`font-display font-bold tabular-nums text-white ${compact ? "text-lg" : "text-xl"}`}
          >
            {pct}%
          </span>
          <Link
            href="/panel"
            className={
              compact
                ? "rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold text-teal-200 hover:bg-white/5"
                : "rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-teal-200 hover:bg-white/5"
            }
          >
            Resumen
          </Link>
        </div>
      </div>
      <div
        className={`overflow-hidden rounded-full bg-white/10 ${compact ? "mt-2 h-1.5" : "mt-3 h-2"}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-600 via-teal-400 to-emerald-400 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showFooter && pct < 100 ? (
        <p className={`text-center text-slate-500/80 ${compact ? "mt-2 text-[10px]" : "mt-3 text-xs"}`}>
          <Link href={quickHref} className="font-medium text-teal-300/90 hover:text-teal-200">
            {quickLabel}
          </Link>
          <span className="text-slate-600"> · </span>
          <Link href="/panel/invitacion" className="text-teal-300/90 hover:text-teal-200">
            Invitación
          </Link>
        </p>
      ) : null}
    </div>
  );
}
