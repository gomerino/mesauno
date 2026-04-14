import Link from "next/link";
import type { PanelStepId } from "@/lib/panel-setup-progress";

export type PanelChecklistRow = {
  id: PanelStepId;
  title: string;
  description: string;
  done: boolean;
  href: string;
  ctaLabel: string;
};

type Props = {
  pct: number;
  rows: PanelChecklistRow[];
  /** En móvil el encabezado y barra duplican el hero de Inicio; ocultarlos ahí. */
  hideIntroOnMobile?: boolean;
};

export function PanelSetupSection({ pct, rows, hideIntroOnMobile = false }: Props) {
  const introWrap = hideIntroOnMobile ? "hidden md:block" : "block";

  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 ${hideIntroOnMobile ? "mt-4 md:mt-8" : "mt-8"}`}
      aria-labelledby={hideIntroOnMobile ? undefined : "panel-setup-heading"}
      aria-label={hideIntroOnMobile ? "Pasos para completar tu evento" : undefined}
    >
      <div className={introWrap}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="panel-setup-heading" className="font-display text-lg font-semibold text-white">
            {pct >= 100 ? "Tu invitación está lista" : "Tu gran día empieza aquí"}
          </h2>
          <p className="text-sm tabular-nums text-teal-300">{pct}%</p>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          {pct >= 100
            ? "Todo el esencial está listo. Puedes seguir afinando detalles cuando quieras."
            : "Tres pasos para dejar la invitación lista: datos del evento, invitados y compartir el enlace."}
        </p>
        <div
          className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400 transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <h3
        className={`text-xs font-semibold uppercase tracking-wide text-slate-500 ${hideIntroOnMobile ? "mt-0 md:mt-8" : "mt-8"}`}
      >
        Próximos pasos
      </h3>
      <ul className="mt-3 space-y-3">
        {rows.map((row, index) => (
          <li key={row.id}>
            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex min-w-0 flex-1 gap-3">
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    row.done ? "bg-teal-500/25 text-teal-300" : "border border-dashed border-white/25 text-slate-400"
                  }`}
                  aria-hidden
                >
                  {row.done ? "✓" : index + 1}
                </span>
                <div className="min-w-0">
                  <p className={`font-medium ${row.done ? "text-slate-400" : "text-white"}`}>{row.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{row.description}</p>
                </div>
              </div>
              <Link
                href={row.href}
                className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold sm:min-h-0 ${
                  row.done
                    ? "border border-white/15 bg-transparent text-slate-200 hover:bg-white/5"
                    : "bg-teal-500 text-white hover:bg-teal-400"
                }`}
              >
                {row.ctaLabel}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
