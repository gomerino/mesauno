"use client";

import { InvitadosManager } from "@/components/InvitadosManager";
import { panelCtaJurnexJourneyPillLayoutFull, panelCtaJurnexPrimary } from "@/components/panel/ds";
import { JourneyMissionStrip } from "@/components/panel/journey/JourneyMissionStrip";
import { PanelMissionCard } from "@/components/panel/PanelMissionCard";
import { useEnvioInvitaciones } from "@/hooks/useEnvioInvitaciones";
import { useInvitaciones } from "@/hooks/useInvitaciones";
import {
  PANEL_INVITADOS_SUBTITLE,
  PANEL_INVITADOS_TITLE,
  panelSectionSubtitleClass,
  panelSectionTitleClass,
} from "@/lib/panel-section-copy";
import { PasajerosToolbelt } from "@/components/panel/pasajeros/PasajerosToolbelt";
import { WhatsappEnviarColaModal } from "@/components/panel/pasajeros/WhatsappEnviarColaModal";
import type { WhatsappColaItem } from "@/components/panel/pasajeros/whatsapp-cola";
import { trackEvent } from "@/lib/analytics";
import {
  invitadoElegibleReenvioRecordatorio,
  invitadoElegibleReenvioWhatsapp,
} from "@/lib/invitado-reenvio-recordatorio";
import { pasajerosVozJurnex } from "@/lib/pasajeros-voz-jurnex";
import {
  getGuestMissionSteps,
  guestMissionDescriptionFromSteps,
  guestMissionStripProps,
  totalPersonasEnLista,
} from "@/lib/guest-mission";
import type { InvitadoMetricaFiltro } from "@/lib/invitaciones-metricas";
import type { CanalEnvioInvitacion, Evento, Invitado } from "@/types/database";
import Link from "next/link";
import { Loader2, Lock, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  eventoId: string | null;
  /** Plan Esencial o Experiencia pagado; habilita envíos, insistir y copiar enlace. */
  planPagado: boolean;
  initialInvitados: Invitado[];
  fromMission: boolean;
  /** Filtro desde métricas del home (`?metrica=`). `null` = todos. */
  metricaFiltro: InvitadoMetricaFiltro | null;
  /** Metas en `eventos` para la misión «Meta». */
  eventoMeta: Pick<Evento, "objetivo_invitaciones_enviar" | "objetivo_personas_total"> | null;
};

const filtroLabel: Record<InvitadoMetricaFiltro, string> = {
  todos: "Todos",
  confirmados: "Confirmados",
  no_asistir: "No podrán asistir",
  pendientes: "Pendientes",
};

export function PasajerosPage({
  eventoId,
  planPagado,
  initialInvitados,
  fromMission,
  metricaFiltro,
  eventoMeta,
}: Props) {
  const [rows, setRows] = useState<Invitado[]>(initialInvitados);
  const [canal, setCanal] = useState<CanalEnvioInvitacion>("ambos");
  const [waCola, setWaCola] = useState<{
    open: boolean;
    kind: "envio" | "insistir";
    items: WhatsappColaItem[];
    skipped: number;
  } | null>(null);

  const addInvitadoRef = useRef<(() => void) | null>(null);
  const importListRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setRows(initialInvitados);
  }, [initialInvitados]);

  useEffect(() => {
    trackEvent("guests_page_viewed", { from_mission: fromMission });
  }, [fromMission]);

  const guestSteps = useMemo(() => getGuestMissionSteps(rows), [rows]);
  const pasajerosStrip = useMemo(() => guestMissionStripProps(guestSteps), [guestSteps]);
  const misionHint = useMemo(() => guestMissionDescriptionFromSteps(guestSteps), [guestSteps]);
  const totalPersonas = useMemo(() => totalPersonasEnLista(rows), [rows]);
  const metaInv = eventoMeta?.objetivo_invitaciones_enviar ?? null;
  const metaPer = eventoMeta?.objetivo_personas_total ?? null;

  const metricas = useInvitaciones(rows);
  const envio = useEnvioInvitaciones(eventoId, canal, {
    onWhatsappCola: (items, ctx) => {
      setWaCola({ open: true, kind: ctx.kind, items, skipped: ctx.skippedSinTelefono });
    },
  });

  const globalBusy = envio.busyScope === "global";
  const showStickyEnviar = Boolean(eventoId && metricas.pendiente > 0);

  const filasElegiblesReenvio = useMemo(
    () =>
      canal === "whatsapp"
        ? rows.filter(invitadoElegibleReenvioWhatsapp)
        : rows.filter(invitadoElegibleReenvioRecordatorio),
    [rows, canal]
  );
  const reenvioCount = filasElegiblesReenvio.length;
  const vozCta = useMemo(() => pasajerosVozJurnex(canal), [canal]);

  return (
    <div className={showStickyEnviar ? "pb-[5.75rem] md:pb-0" : undefined}>
      <div className="mb-3 max-md:mb-4 md:mb-0">
        <div className="flex flex-col gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className={panelSectionTitleClass}>{PANEL_INVITADOS_TITLE}</h1>
            <p className={panelSectionSubtitleClass}>{PANEL_INVITADOS_SUBTITLE}</p>
          </div>

          {metricaFiltro ? (
            <div
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-500/25 bg-teal-500/[0.05] px-3 py-2"
              role="status"
            >
              <p className="min-w-0 text-xs text-white/75">
                Viendo: <span className="font-medium text-teal-100/95">{filtroLabel[metricaFiltro]}</span>
              </p>
              <Link
                href="/panel/pasajeros?from=panel"
                className="shrink-0 text-xs font-semibold text-teal-200/95 underline decoration-teal-500/40 underline-offset-2 hover:text-teal-100"
              >
                Quitar filtro
              </Link>
            </div>
          ) : null}

          {eventoId ? (
            <PanelMissionCard
              micro={misionHint}
              missionStrip={
                <JourneyMissionStrip
                  noTopRule
                  hideMisionesLabel
                  compact
                  {...pasajerosStrip}
                  ariaLabel="Progreso de pasajeros"
                />
              }
              footer={
                <>
                  <span>
                    Lista:{" "}
                    <span className="font-medium text-slate-300 tabular-nums">{rows.length}</span>
                    {metaInv != null && metaInv > 0 ? (
                      <span className="text-slate-500">
                        {" "}
                        / <span className="tabular-nums text-teal-200/90">{metaInv}</span> invitaciones
                      </span>
                    ) : null}
                  </span>
                  <span>
                    Personas:{" "}
                    <span className="font-medium text-slate-300 tabular-nums">{totalPersonas}</span>
                    {metaPer != null && metaPer > 0 ? (
                      <span className="text-slate-500">
                        {" "}
                        / <span className="tabular-nums text-teal-200/90">{metaPer}</span> meta
                      </span>
                    ) : null}
                  </span>
                  <Link
                    href="/panel/viaje"
                    className="text-teal-300/90 underline decoration-teal-500/40 underline-offset-2 hover:text-teal-200"
                  >
                    Editar metas en tu viaje
                  </Link>
                </>
              }
            />
          ) : null}

          <PasajerosToolbelt
            canal={canal}
            onCanalChange={setCanal}
            eventoId={eventoId}
            planPagado={planPagado}
            globalBusy={globalBusy}
            onEnviar={() => void envio.enviarTodosPendientes(rows)}
            onReenviar={() => void envio.reenviarFilas("global", filasElegiblesReenvio)}
            onAdd={() => addInvitadoRef.current?.()}
            onImport={() => importListRef.current?.()}
            reenviarCount={reenvioCount}
            enviarPendienteCount={metricas.pendiente}
          />
        </div>
      </div>

      <div className="mt-4 max-md:mt-4 md:mt-6">
        <InvitadosManager
          eventoId={eventoId}
          initialInvitados={initialInvitados}
          rows={rows}
          setRows={setRows}
          planPagado={planPagado}
          addInvitadoRef={addInvitadoRef}
          importListRef={importListRef}
          metricaFiltro={metricaFiltro}
        />
      </div>

      {waCola ? (
        <WhatsappEnviarColaModal
          open={waCola.open}
          onClose={() => setWaCola(null)}
          kind={waCola.kind}
          items={waCola.items}
          skippedSinTelefono={waCola.skipped}
        />
      ) : null}

      {showStickyEnviar ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 md:hidden">
          <div className="pointer-events-auto w-full max-w-lg rounded-2xl border border-white/10 bg-jurnex-bg/90 p-1.5 shadow-[0_-8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <button
              type="button"
              disabled={globalBusy || !planPagado}
              title={
                !planPagado
                  ? "Contrata un plan de pago para enviar invitaciones o usar Insistir."
                  : undefined
              }
              onClick={() => void envio.enviarTodosPendientes(rows)}
              className={panelCtaJurnexPrimary + " " + panelCtaJurnexJourneyPillLayoutFull + " gap-2"}
            >
              {globalBusy ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              ) : !planPagado ? (
                <Lock className="h-4 w-4 shrink-0 text-black/55" strokeWidth={2.25} aria-hidden />
              ) : (
                <Send className="h-4 w-4 shrink-0" aria-hidden />
              )}
              <span className="line-clamp-2 min-w-0 text-balance text-center leading-tight">{vozCta.cta}</span>
              <span className="inline-flex min-w-[1.5rem] shrink-0 items-center justify-center rounded-md bg-black/15 px-1.5 text-xs font-extrabold text-black/70 tabular-nums">
                {metricas.pendiente}
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
