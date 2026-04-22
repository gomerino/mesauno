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
  /** Variante legacy: mismo tratamiento visual liviano. */
  variant?: "default" | "compact";
  /** En inicio del panel el CTA principal vive en `JourneyPrimaryCta`; oculta enlaces duplicados abajo. */
  footer?: "default" | "none";
};

export function PanelSlimProgress({
  pct,
  headline,
  nextStep,
  variant: _variant = "default",
  footer = "default",
}: Props) {
  const quickHref = panelNextActionHref(nextStep);
  const quickLabel = panelNextActionLabel(nextStep);
  const showFooter = footer === "default";

  return (
    <div className="border-b border-white/[0.06] pb-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-400/50">Progreso</p>
          <p className="mt-0.5 text-xs leading-snug text-slate-500">{headline}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-display text-base font-semibold tabular-nums text-slate-400">{pct}%</span>
          <Link
            href="/panel"
            className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-400 transition hover:border-white/15 hover:text-slate-300"
          >
            Resumen
          </Link>
        </div>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-700 via-teal-500 to-teal-400/90 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showFooter && pct < 100 ? (
        <p className="mt-2 text-center text-[10px] text-slate-600">
          <Link href={quickHref} className="font-medium text-teal-400/80 hover:text-teal-300">
            {quickLabel}
          </Link>
          <span className="text-slate-700"> · </span>
          <Link href="/panel/pasajeros/envios" className="text-teal-400/80 hover:text-teal-300">
            Invitación
          </Link>
        </p>
      ) : null}
    </div>
  );
}
