import Link from "next/link";
import { panelGrowthLine } from "@/lib/panel-progress-load";
import type { PanelStepId } from "@/lib/panel-setup-progress";

type Props = {
  pct: number;
  steps: Record<PanelStepId, boolean>;
  /** Barra compacta al final en móvil. */
  variant?: "default" | "compact";
};

export function PanelSlimProgress({ pct, steps, variant = "default" }: Props) {
  const line = panelGrowthLine(pct, steps);
  const compact = variant === "compact";

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
                ? "text-[10px] font-semibold uppercase tracking-wide text-teal-400/90"
                : "text-xs font-semibold uppercase tracking-wide text-teal-400/90"
            }
          >
            Avance del evento
          </p>
          <p className={`text-slate-300 ${compact ? "mt-0.5 text-xs leading-snug" : "mt-1 text-sm"}`}>{line}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`font-display font-bold tabular-nums text-white ${compact ? "text-lg" : "text-2xl"}`}
          >
            {pct}%
          </span>
          <Link
            href="/panel/overview"
            className={
              compact
                ? "rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold text-teal-200 hover:bg-white/5"
                : "rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-teal-200 hover:bg-white/5"
            }
          >
            Ver plan
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
      {pct < 100 ? (
        <p className={`text-center text-slate-500 ${compact ? "mt-2 text-[10px]" : "mt-3 text-xs"}`}>
          <Link href="/panel/evento" className="text-teal-300/90 hover:text-teal-200">
            Completar evento
          </Link>
          <span className="text-slate-600"> · </span>
          <Link href="/panel/invitados" className="text-teal-300/90 hover:text-teal-200">
            Agregar invitados
          </Link>
        </p>
      ) : null}
    </div>
  );
}
