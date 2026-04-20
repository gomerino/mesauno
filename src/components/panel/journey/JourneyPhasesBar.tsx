"use client";

import { trackEvent } from "@/lib/analytics";
import {
  JOURNEY_PHASES_UI,
  journeyPhaseEyebrow,
  journeyPhaseIndex,
  journeyPhaseObjective,
  type JourneyPhaseId,
} from "@/lib/journey-phases";
import { Check, Lock, Plane } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

type Props = {
  phase: JourneyPhaseId;
  className?: string;
  /** p. ej. "2 de 4 listo" */
  progressPrimary?: string;
  progressHint?: string | null;
  /**
   * Si `false`, el hito `en-vuelo` se renderiza como `locked` (candado dorado
   * dim). Default `true` → no bloquea ningún hito. El gating premium real es
   * T11 (JUR-25); acá solo afecta la presentación visual.
   *
   * TODO(JUR-29): cuando restauremos el context extendido con `isPlanActive`,
   * leerlo directamente y eliminar este prop.
   */
  isPlanActive?: boolean;
  /** Marco dorado + glow (p. ej. continuidad con bloque de misión en Invitados). */
  accentPremium?: boolean;
};

type PhaseState = "past" | "current" | "future" | "locked";

/**
 * Clases Tailwind del círculo por estado.
 *
 * Nota: usamos `#D4AF37` hardcoded hasta que se restaure JUR-29 con las
 * CSS vars `--jur-gold-*`. Cuando JUR-29 se reimplante, este archivo se
 * beneficia sin cambios estructurales migrando a `var(--jur-gold-primary)`.
 */
function circleClassesFor(state: PhaseState): string {
  const base =
    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 md:h-11 md:w-11";
  switch (state) {
    case "past":
      return `${base} border-transparent bg-[#D4AF37] text-[#0f172a] shadow-[0_4px_14px_rgba(212,175,55,0.30)]`;
    case "current":
      return `${base} border-[#D4AF37] bg-[rgba(212,175,55,0.10)] text-[#D4AF37] shadow-[0_0_26px_rgba(212,175,55,0.35)]`;
    case "locked":
      return `${base} border-dashed border-[rgba(212,175,55,0.40)] bg-transparent text-[rgba(212,175,55,0.55)]`;
    case "future":
    default:
      return `${base} border-slate-600/50 bg-transparent text-slate-500`;
  }
}

/**
 * Segmento de línea conectora entre dos hitos.
 *
 * - past→current (o past→past): foil gradient dorado (oscuro → claro).
 * - future→locked (o locked→anything): dashed dorado dim (indica premio al final).
 * - resto: dashed slate tenue.
 */
function ConnectorSegment({ from, to }: { from: PhaseState; to: PhaseState }) {
  const isFoil =
    (from === "past" && (to === "current" || to === "past")) ||
    (from === "current" && to === "past");
  const isDashedGold = to === "locked" || from === "locked";

  if (isFoil) {
    return (
      <span
        className="block h-[2.5px] w-full rounded-full bg-gradient-to-r from-[#8B6F1F] via-[#D4AF37] to-[#E8C547]"
        aria-hidden
      />
    );
  }
  if (isDashedGold) {
    return (
      <span
        className="block h-0 w-full border-t-[2.5px] border-dashed border-[rgba(212,175,55,0.30)]"
        aria-hidden
      />
    );
  }
  return (
    <span
      className="block h-0 w-full border-t-[2.5px] border-dashed border-slate-500/30"
      aria-hidden
    />
  );
}

export function JourneyPhasesBar({
  phase,
  className = "",
  progressPrimary,
  progressHint,
  isPlanActive = true,
  accentPremium = false,
}: Props) {
  const pathname = usePathname();
  const progressCombined = [progressPrimary, progressHint].filter(Boolean).join(" · ");

  const currentIdx = journeyPhaseIndex(phase);

  const phases = useMemo(() => {
    return JOURNEY_PHASES_UI.map((p, idx) => {
      let state: PhaseState;
      if (idx < currentIdx) state = "past";
      else if (idx === currentIdx) state = "current";
      else if (idx === 2 && !isPlanActive) state = "locked";
      else state = "future";
      return { ...p, idx, state };
    });
  }, [currentIdx, isPlanActive]);

  /**
   * Posición horizontal del avión: centro de cada círculo en un grid de 3 cols.
   * Columna 0 → 1/6 del ancho. Columna 1 → 3/6. Columna 2 → 5/6.
   * La animación usa un spring easing para dar sensación de vuelo premium.
   */
  const planeLeftPct = (currentIdx * 2 + 1) * (100 / 6);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Fondo premium: glass + radial gradient dorado muy sutil arriba. */}
      <div
        className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[radial-gradient(ellipse_60%_60%_at_50%_-20%,rgba(212,175,55,0.08),transparent_70%)] bg-white/[0.03] px-3 pb-3 pt-4 md:px-5 md:pb-4 md:pt-5 ${
          accentPremium
            ? "shadow-[0_0_36px_-10px_rgba(212,175,55,0.28)] ring-1 ring-[#D4AF37]/30"
            : ""
        }`}
      >
        <ol
          className="relative grid grid-cols-3 items-start"
          aria-label="Etapas del viaje"
        >
          {/* Avión animado — transiciona horizontalmente entre fases. */}
          <span
            className="pointer-events-none absolute -top-2 z-20 -translate-x-1/2 text-[#D4AF37] transition-[left,transform] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none md:-top-2.5"
            style={{ left: `${planeLeftPct}%` }}
            aria-hidden
          >
            <Plane
              className="h-4 w-4 rotate-[20deg] drop-shadow-[0_2px_8px_rgba(212,175,55,0.45)] md:h-5 md:w-5"
              strokeWidth={2}
            />
          </span>

          {phases.map((p) => {
            const here = pathname === p.href || pathname.startsWith(`${p.href}/`);
            const isCurrent = p.state === "current";
            const isLocked = p.state === "locked";
            const isPast = p.state === "past";
            const nextState = phases[p.idx + 1]?.state;

            const labelClass = isCurrent
              ? "text-white"
              : isPast
                ? "text-slate-200"
                : isLocked
                  ? "text-[rgba(212,175,55,0.60)]"
                  : "text-slate-400 group-hover:text-slate-200";

            return (
              <li key={p.id} className="relative flex flex-col items-center">
                {/* Línea conectora al siguiente hito (no se renderiza en el último). */}
                {p.idx < 2 && nextState ? (
                  <span
                    className="pointer-events-none absolute left-1/2 top-5 z-0 flex h-[2.5px] w-full items-center md:top-[22px]"
                    aria-hidden
                  >
                    <ConnectorSegment from={p.state} to={nextState} />
                  </span>
                ) : null}

                <Link
                  href={p.href}
                  onClick={() => {
                    if (!isCurrent) {
                      trackEvent("panel_phase_clicked", {
                        from_phase: phase,
                        to_phase: p.id,
                        locked: isLocked,
                      });
                    }
                  }}
                  className="group relative flex w-full flex-col items-center gap-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050810]"
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <span className={circleClassesFor(p.state)}>
                    {isPast ? (
                      <Check className="h-4 w-4 md:h-[18px] md:w-[18px]" strokeWidth={3} />
                    ) : isCurrent ? (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4AF37] opacity-60" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
                      </span>
                    ) : isLocked ? (
                      <Lock className="h-3.5 w-3.5 md:h-4 md:w-4" strokeWidth={2} />
                    ) : (
                      <span className="text-xs font-semibold md:text-sm">{p.idx + 1}</span>
                    )}
                  </span>

                  <span className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/75 md:text-[10px] md:tracking-[0.22em]">
                    {journeyPhaseEyebrow(p.id as JourneyPhaseId)}
                  </span>
                  <span
                    className={`text-xs font-medium transition-colors md:text-sm ${labelClass}`}
                  >
                    {p.label}
                  </span>

                  {/* SR: señala la página activa cuando navegás dentro de esa fase */}
                  {here && !isCurrent ? (
                    <span className="sr-only">Estás en esta sección</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="mt-2.5 line-clamp-2 text-xs leading-snug text-slate-400 md:mt-3 md:line-clamp-none md:text-sm">
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
