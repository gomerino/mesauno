"use client";

import { panelCtaJurnexJourneyPillLayout, panelCtaJurnexJourneyPillLayoutFull, panelCtaJurnexPrimary } from "@/components/panel/ds";
import { pasajerosVozJurnex } from "@/lib/pasajeros-voz-jurnex";
import type { CanalEnvioInvitacion } from "@/types/database";
import { FileUp, Loader2, Lock, Plus, RefreshCw, Send } from "lucide-react";
import { useId, useMemo } from "react";

const CANAL: { value: CanalEnvioInvitacion; label: string; micro: string }[] = [
  { value: "correo", label: "Correo", micro: "Email" },
  { value: "whatsapp", label: "WhatsApp", micro: "WA" },
  { value: "ambos", label: "Ambos", micro: "Ambos" },
];

const PLAN_ENVIO_BLOQUEADO =
  "Contrata un plan de pago para enviar invitaciones o usar Insistir.";

/** Mismo ancho que la lista (`InvitadosGrupo`): ancho completo de la columna, sin tope `max-w-3xl`. */
const shellDesktop =
  "w-full min-w-0 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-0.5 shadow-sm shadow-black/20 ring-1 ring-white/[0.04] md:flex md:items-stretch md:gap-0 md:rounded-[1.25rem]";

type Props = {
  canal: CanalEnvioInvitacion;
  onCanalChange: (c: CanalEnvioInvitacion) => void;
  eventoId: string | null;
  /** Plan Esencial o Experiencia pagado; si no, se bloquean Enviar e Insistir. */
  planPagado: boolean;
  globalBusy: boolean;
  onEnviar: () => void;
  onReenviar: () => void;
  onAdd: () => void;
  onImport: () => void;
  reenviarCount: number;
  /** Pendientes de envío (móvil y escritorio). */
  enviarPendienteCount: number;
};

/**
 * Barra de acciones pasajeros: móvil = “premium” (segmented, tarjeta, CTA y acciones terciarias);
 * escritorio = fila densa con canal y botones a la derecha.
 */
export function PasajerosToolbelt({
  canal,
  onCanalChange,
  eventoId,
  planPagado,
  globalBusy,
  onEnviar,
  onReenviar,
  onAdd,
  onImport,
  reenviarCount,
  enviarPendienteCount,
}: Props) {
  const idBase = useId();
  const t = useMemo(() => pasajerosVozJurnex(canal), [canal]);
  const reenvioDisabled = globalBusy || !eventoId || reenviarCount === 0 || !planPagado;
  const enviarDisabled = globalBusy || !eventoId || !planPagado;

  return (
    <div className="w-full min-w-0">
      {/* Móvil: tarjeta con jerarquía y tacto de app premium */}
      <div
        className={`md:hidden ${shellDesktop} flex flex-col gap-3 p-3 pb-4 [box-shadow:0_12px_40px_-8px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]`}
      >
        <div className="px-0.5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/40">
            Cómo le escribes
          </p>
        </div>

        <div
          className="grid grid-cols-3 gap-0 rounded-2xl border border-white/[0.08] bg-black/35 p-0.5 shadow-inner shadow-black/30"
          role="group"
          aria-label="Cómo le escribes: correo, WhatsApp o ambos"
        >
          {CANAL.map((c) => {
            const active = canal === c.value;
            return (
              <button
                key={c.value}
                type="button"
                id={`${idBase}-canal-${c.value}`}
                onClick={() => onCanalChange(c.value)}
                className={[
                  "relative z-0 flex min-h-[2.75rem] flex-col items-center justify-center rounded-[0.8rem] px-1.5 text-center transition duration-200",
                  active
                    ? "z-[1] bg-gradient-to-b from-white/[0.12] to-white/[0.04] text-white shadow-md shadow-black/20 ring-1 ring-white/15"
                    : "text-white/45 active:bg-white/[0.04] hover:text-white/70",
                ].join(" ")}
                aria-pressed={active}
              >
                <span className="text-xs font-semibold leading-tight">{c.micro}</span>
                <span
                  className={[
                    "mt-0.5 max-w-full truncate text-[0.6rem] leading-tight",
                    active ? "text-white/60" : "text-white/30",
                  ].join(" ")}
                >
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>

        <p className="px-0.5 text-[0.65rem] leading-snug text-white/42">{t.bajoCanal}</p>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent" aria-hidden />

        <div className="space-y-2.5">
          <button
            type="button"
            disabled={enviarDisabled}
            title={!planPagado ? PLAN_ENVIO_BLOQUEADO : undefined}
            onClick={onEnviar}
            className={panelCtaJurnexPrimary + " " + panelCtaJurnexJourneyPillLayoutFull + " gap-2.5"}
          >
            {globalBusy ? (
              <span className="inline-flex w-full items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Enviando…
              </span>
            ) : (
              <span className="inline-flex w-full items-center justify-center gap-2.5">
                {!planPagado ? (
                  <Lock
                    className="h-5 w-5 shrink-0 text-black/55 [filter:drop-shadow(0_1px_0_rgba(0,0,0,0.15))]"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                ) : (
                  <Send
                    className="h-5 w-5 opacity-90 [filter:drop-shadow(0_1px_0_rgba(0,0,0,0.2))]"
                    aria-hidden
                  />
                )}
                <span className="line-clamp-2 min-w-0 text-balance text-center leading-tight">{t.cta}</span>
                <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-md bg-black/20 px-1.5 text-xs font-extrabold text-black/75 tabular-nums">
                  {enviarPendienteCount}
                </span>
              </span>
            )}
          </button>

          <p
            className="px-0.5 text-[0.6rem] leading-relaxed text-white/36"
            id={`${idBase}-insistir-ayuda`}
          >
            {t.bajoInsistir}
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              title={!planPagado ? PLAN_ENVIO_BLOQUEADO : t.hintInsistir}
              disabled={reenvioDisabled}
              onClick={onReenviar}
              aria-describedby={`${idBase}-insistir-ayuda`}
              className="inline-flex h-[3.5rem] flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] text-center text-xs font-medium text-white/80 shadow-inner shadow-black/20 transition hover:border-white/15 hover:bg-white/[0.07] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40"
            >
              {!planPagado ? (
                <Lock className="h-4 w-4 text-white/45" strokeWidth={2.25} aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4 text-white/50" strokeWidth={2.25} aria-hidden />
              )}
              <span className="text-[0.7rem] leading-tight">Insistir</span>
              {reenviarCount > 0 ? (
                <span className="text-[0.6rem] tabular-nums text-white/40">({reenviarCount})</span>
              ) : null}
            </button>
            <button
              type="button"
              id="invitados-btn-add"
              onClick={onAdd}
              className="inline-flex h-[3.5rem] flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] text-center text-xs font-medium text-white/80 transition hover:border-white/15 hover:bg-white/[0.07] active:scale-[0.99]"
            >
              <Plus className="h-4 w-4 text-amber-300/95" strokeWidth={2.25} aria-hidden />
              <span className="text-[0.7rem] leading-tight">Añadir</span>
            </button>
          </div>

          <button
            type="button"
            id="invitados-btn-import"
            onClick={onImport}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] py-2.5 text-xs font-medium text-white/50 transition hover:border-white/20 hover:text-white/70"
          >
            <FileUp className="h-3.5 w-3.5" aria-hidden />
            Importar lista
          </button>
        </div>
      </div>

      {/* Escritorio: compacto, alineado al panel existente */}
      <div
        className={`${shellDesktop} hidden p-0.5 md:grid md:min-h-[3.5rem] md:grid-cols-[minmax(0,20rem)_1fr] md:items-start md:gap-0 md:px-1.5 md:py-1`}
      >
        <div className="border-b border-white/[0.06] px-2.5 py-2.5 md:border-b-0 md:border-r md:py-2.5">
          <p className="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-widest text-white/35">Cómo le escribes</p>
          <div
            className="inline-flex w-full max-w-full rounded-xl border border-white/10 bg-black/25 p-0.5"
            role="group"
            aria-label="Cómo le escribes a los invitados (correo, WhatsApp o ambos)"
          >
            {CANAL.map((c) => {
              const active = canal === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => onCanalChange(c.value)}
                  className={[
                    "min-w-0 flex-1 rounded-lg px-2 py-1.5 text-center text-xs font-medium transition",
                    active
                      ? "bg-white/12 text-white shadow-sm"
                      : "text-white/45 hover:bg-white/[0.05] hover:text-white/75",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 hidden text-[0.6rem] leading-snug text-white/38 md:block">{t.bajoCanal}</p>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5 px-2.5 py-2 md:px-3">
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
            <button
              type="button"
              disabled={enviarDisabled}
              title={!planPagado ? PLAN_ENVIO_BLOQUEADO : undefined}
              onClick={onEnviar}
              className={panelCtaJurnexPrimary + " " + panelCtaJurnexJourneyPillLayout + " max-w-full shrink-0 gap-1.5"}
            >
              {globalBusy ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
              ) : !planPagado ? (
                <Lock className="h-3.5 w-3.5 shrink-0 text-black/55" strokeWidth={2.25} aria-hidden />
              ) : (
                <Send className="h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
              <span className="max-w-[12rem] truncate sm:max-w-none">{t.cta}</span>
              {enviarPendienteCount > 0 ? (
                <span className="shrink-0 rounded bg-black/20 px-1.5 text-[0.7rem] font-extrabold text-black/75 tabular-nums">
                  {enviarPendienteCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              title={!planPagado ? PLAN_ENVIO_BLOQUEADO : t.hintInsistir}
              disabled={reenvioDisabled}
              onClick={onReenviar}
              aria-describedby={`${idBase}-insistir-ayuda-dsk`}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg border border-white/12 bg-white/[0.05] px-2.5 text-xs font-medium text-white/85 transition hover:bg-white/[0.09] disabled:opacity-40"
            >
              {!planPagado ? (
                <Lock className="h-3.5 w-3.5 text-white/45" strokeWidth={2.25} aria-hidden />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 opacity-80" aria-hidden />
              )}
              <span>Insistir</span>
              <span className="tabular-nums text-white/45">({reenviarCount})</span>
            </button>
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg border border-white/10 bg-transparent px-2.5 text-xs font-medium text-white/80 transition hover:bg-white/[0.05]"
            >
              <Plus className="h-3.5 w-3.5 text-amber-300/95" aria-hidden />
              Añadir
            </button>
            <button
              type="button"
              onClick={onImport}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg border border-white/6 bg-white/[0.02] px-2.5 text-xs font-medium text-white/60 transition hover:bg-white/[0.05] hover:text-white/80"
            >
              <FileUp className="h-3.5 w-3.5" aria-hidden />
              Importar
            </button>
          </div>
          <p
            className="hidden text-right text-[0.6rem] leading-relaxed text-white/35 md:block"
            id={`${idBase}-insistir-ayuda-dsk`}
          >
            {t.bajoInsistir}
          </p>
        </div>
      </div>
    </div>
  );
}
