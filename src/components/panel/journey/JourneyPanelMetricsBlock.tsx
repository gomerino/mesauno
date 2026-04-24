"use client";

import { PANEL_VIAJE_PENDIENTE_CERO_MICRO } from "@/lib/panel-section-copy";
import type { InvitadoMetricaFiltro } from "@/lib/invitaciones-metricas";
import { Clock, Sparkles, UserCheck, UserX, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

const PASAJEROS = "/panel/pasajeros";

const hrefMap: Record<InvitadoMetricaFiltro, string> = {
  todos: `${PASAJEROS}?from=panel`,
  confirmados: `${PASAJEROS}?metrica=confirmados&from=panel`,
  no_asistir: `${PASAJEROS}?metrica=no_asistir&from=panel`,
  pendientes: `${PASAJEROS}?metrica=pendientes&from=panel`,
};

const metricCardBase =
  "group relative block min-w-0 rounded-xl border border-white/14 bg-gradient-to-b from-white/[0.1] to-white/[0.03] px-2.5 py-2.5 text-left shadow-sm shadow-black/20 outline-none transition-[border-color,box-shadow,transform,background] duration-200 min-h-0 sm:px-3 sm:py-2.5 md:rounded-2xl md:px-3.5";

const metricCardInteractive =
  " cursor-pointer hover:border-teal-400/35 hover:shadow-[0_0_22px_rgba(45,212,191,0.14)] focus-visible:ring-2 focus-visible:ring-teal-400/40 active:scale-[0.99]";

const metricNumberClass =
  "text-[1.5rem] font-bold tabular-nums leading-none tracking-tight text-white sm:text-[1.7rem] md:text-[1.9rem]";

const metricLabelClass =
  "text-[8px] font-bold uppercase leading-tight tracking-[0.2em] text-slate-400/95 sm:text-[9px] sm:tracking-[0.18em]";

const metricSubClass = "text-[8px] leading-tight text-slate-500/90 sm:text-[9px]";

type MetricDef = {
  id: "lista" | "ok" | "no" | "pen";
  label: string;
  sub: string;
  value: number;
  icon: LucideIcon;
  filtro: InvitadoMetricaFiltro;
  accent: "teal" | "rose";
};

function iconWrap(
  _id: string,
  accent: MetricDef["accent"],
  compact: boolean
) {
  const a =
    accent === "rose"
      ? "border-rose-400/25 bg-rose-500/12 text-rose-200/90"
      : "border-white/12 bg-white/[0.07] text-teal-200/95";
  return clsx(
    "flex items-center justify-center rounded-lg border",
    compact ? "h-7 w-7" : "h-8 w-8 sm:h-9 sm:w-9",
    a
  );
}

type Props = {
  totalInvitados: number;
  confirmadas: number;
  noAsistire: number;
  pendienteConfirmar: number;
};

/**
 * Home `/panel`: métricas clickeables. Branding Jurnex: oscuro, teal, bordes definidos.
 */
export function JourneyPanelMetricsBlock({
  totalInvitados,
  confirmadas,
  noAsistire,
  pendienteConfirmar,
}: Props) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const act = useCallback(
    (f: InvitadoMetricaFiltro) => {
      if (pathname !== "/panel/pasajeros") return false;
      const m = sp.get("metrica");
      if (f === "todos" && (m == null || m === "")) return true;
      return m === f;
    },
    [pathname, sp]
  );

  const baseItems: MetricDef[] = useMemo(
    () => [
      { id: "lista", label: "Invitados", sub: "Personas invitadas", value: totalInvitados, icon: Users, filtro: "todos", accent: "teal" },
      { id: "ok", label: "Confirmados", sub: "Confirmaron asistencia", value: confirmadas, icon: UserCheck, filtro: "confirmados", accent: "teal" },
      {
        id: "no",
        label: "No podrán asistir",
        sub: "Avisaron que no asistirán",
        value: noAsistire,
        icon: UserX,
        filtro: "no_asistir",
        accent: "rose",
      },
    ],
    [totalInvitados, confirmadas, noAsistire]
  );

  const pZero = pendienteConfirmar === 0;

  return (
    <div className="flex w-full flex-col gap-2 md:gap-2.5" role="group" aria-label="Métricas de invitados">
      <div className="sm:hidden">
        <div className="overflow-hidden rounded-2xl border border-white/14 bg-gradient-to-b from-white/[0.09] to-white/[0.02] shadow-sm shadow-black/30">
          {baseItems.map((m, i) => (
            <div key={m.id} className={i > 0 ? "border-t border-white/10" : undefined}>
              <Link
                href={hrefMap[m.filtro]}
                className={clsx(metricCardBase, metricCardInteractive, "sm:block flex items-center gap-2.5 !rounded-none border-0 !shadow-none", act(m.filtro) && "ring-1 ring-inset ring-teal-400/35 bg-teal-500/[0.04]")}
              >
                <div
                  className={iconWrap(
                    m.id,
                    m.accent,
                    true
                  )}
                >
                  <m.icon className="h-3.5 w-3.5" strokeWidth={1.85} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.8rem] font-semibold text-white/95 sm:text-sm">{m.label}</p>
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-500/90">{m.sub}</p>
                </div>
                <p className="shrink-0 text-lg font-bold tabular-nums text-white">{m.value}</p>
              </Link>
            </div>
          ))}
          {pZero ? (
            <div className="border-t border-white/10 p-1.5">
              <div className="overflow-hidden rounded-lg border jurnex-metric-pendiente-celebracion border-teal-300/30 bg-gradient-to-b from-teal-500/[0.1] to-white/[0.02] p-0.5">
                <Link
                  href={hrefMap.pendientes}
                  className={clsx(metricCardBase, metricCardInteractive, "!m-0 flex w-full !border-0 !bg-transparent !p-0 !shadow-none", act("pendientes") && "ring-1 ring-inset ring-teal-300/50")}
                >
                  <div className="flex w-full items-center gap-2.5 px-1.5 py-2.5 pl-2">
                    <div
                      className={iconWrap("pen", "teal", true) + " text-teal-200"}
                    >
                      <Sparkles className="h-3.5 w-3.5 motion-safe:animate-pulse" strokeWidth={1.85} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.8rem] font-semibold text-white/95">Pendientes</p>
                      <p className="mt-0.5 line-clamp-2 pr-0.5 text-[10px] font-medium text-teal-200/90">
                        {PANEL_VIAJE_PENDIENTE_CERO_MICRO}
                      </p>
                    </div>
                    <p className="shrink-0 text-lg font-bold tabular-nums text-teal-100/95">0</p>
                  </div>
                </Link>
              </div>
            </div>
          ) : (
            <div className="border-t border-white/10">
              <Link
                href={hrefMap.pendientes}
                className={clsx(metricCardBase, metricCardInteractive, "flex w-full !rounded-none !border-0 !shadow-none", act("pendientes") && "ring-1 ring-inset ring-teal-400/40 bg-teal-500/[0.04]")}
              >
                <div
                  className={iconWrap("pen", "teal", true) + " text-teal-200/90"}
                >
                  <Clock className="h-3.5 w-3.5" strokeWidth={1.85} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.8rem] font-semibold text-white/95">Pendientes</p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-500/90">
                    Te faltan {pendienteConfirmar} por confirmar
                  </p>
                </div>
                <p className="shrink-0 text-lg font-bold tabular-nums text-white">{pendienteConfirmar}</p>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="hidden sm:grid sm:grid-cols-2 sm:gap-2.5 md:grid-cols-4">
        {baseItems.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.id}
              href={hrefMap[m.filtro]}
              className={clsx(metricCardBase, metricCardInteractive, "pt-2.5 text-center", act(m.filtro) && "border-teal-400/40 shadow-[0_0_20px_rgba(45,212,191,0.12)]")}
            >
              <div className="mx-auto flex w-full max-w-[9rem] flex-col items-center">
                <div className={iconWrap(m.id, m.accent, false) + " mx-auto"}>
                  <Icon className="h-4 w-4 sm:h-[1.1rem] sm:w-[1.1rem]" strokeWidth={1.8} />
                </div>
                <p className={clsx(metricNumberClass, "mt-1.5 sm:mt-2.5")}>{m.value}</p>
                <p className={clsx(metricLabelClass, "mt-0.5")}>{m.label}</p>
                <p className={clsx(metricSubClass, "mt-0.5 max-w-full px-0.5")}>{m.sub}</p>
              </div>
            </Link>
          );
        })}

        {pZero ? (
          <Link
            href={hrefMap.pendientes}
            className={clsx(
              metricCardBase,
              metricCardInteractive,
              "jurnex-metric-pendiente-celebracion !border-teal-300/35",
              "pt-2.5 text-center",
              act("pendientes") && "ring-2 ring-teal-300/30"
            )}
          >
            <div className="mx-auto flex w-full max-w-[9rem] flex-col items-center">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg border border-teal-300/30 bg-white/[0.08] text-teal-100">
                <Sparkles className="h-4 w-4 motion-safe:animate-pulse" strokeWidth={1.8} />
              </div>
              <p className={clsx(metricNumberClass, "mt-1.5 text-teal-100/95 sm:mt-2.5", " motion-safe:animate-pulse")}>0</p>
              <p className="mt-0.5 text-[8px] font-bold uppercase leading-tight tracking-[0.18em] text-teal-200/85 sm:text-[9px] sm:tracking-[0.2em]">
                Pendientes
              </p>
              <p className="mt-0.5 text-[8px] leading-relaxed text-teal-200/80 sm:text-[9px]">{PANEL_VIAJE_PENDIENTE_CERO_MICRO}</p>
            </div>
          </Link>
        ) : (
          <Link
            href={hrefMap.pendientes}
            className={clsx(
              metricCardBase,
              metricCardInteractive,
              "pt-2.5 text-center",
              act("pendientes") && "border-teal-400/40 shadow-[0_0_20px_rgba(45,212,191,0.12)]"
            )}
          >
            <div className="mx-auto flex w-full max-w-[9rem] flex-col items-center">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-white/[0.06] text-teal-200/90">
                <Clock className="h-4 w-4" strokeWidth={1.8} />
              </div>
              <p className={clsx(metricNumberClass, "mt-1.5 sm:mt-2.5")}>{pendienteConfirmar}</p>
              <p className={clsx(metricLabelClass, "mt-0.5")}>Pendientes</p>
              <p className="mt-0.5 line-clamp-2 px-0.5 text-[8px] leading-tight text-slate-500/90 sm:text-[9px]">
                Te faltan {pendienteConfirmar} por confirmar
              </p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
