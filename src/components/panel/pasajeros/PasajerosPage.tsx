"use client";

import { InvitadosManager } from "@/components/InvitadosManager";
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
import { trackEvent } from "@/lib/analytics";
import {
  getGuestMissionSteps,
  guestMissionDescriptionFromSteps,
  guestMissionStripProps,
  totalPersonasEnLista,
} from "@/lib/guest-mission";
import type { CanalEnvioInvitacion, Evento, Invitado } from "@/types/database";
import Link from "next/link";
import { ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const btnEnviarInvitaciones =
  "inline-flex items-center justify-center rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-black shadow-sm shadow-teal-900/20 transition-colors duration-200 hover:bg-teal-400 disabled:pointer-events-none disabled:opacity-50";

type Props = {
  eventoId: string | null;
  initialInvitados: Invitado[];
  fromMission: boolean;
  /** Metas en `eventos` para la misión «Meta». */
  eventoMeta: Pick<Evento, "objetivo_invitaciones_enviar" | "objetivo_personas_total"> | null;
};

export function PasajerosPage({ eventoId, initialInvitados, fromMission, eventoMeta }: Props) {
  const [rows, setRows] = useState<Invitado[]>(initialInvitados);
  const [canal, setCanal] = useState<CanalEnvioInvitacion>("ambos");
  const [canalMenuOpen, setCanalMenuOpen] = useState(false);
  const canalWrapRef = useRef<HTMLDivElement>(null);

  const addInvitadoRef = useRef<(() => void) | null>(null);
  const importListRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setRows(initialInvitados);
  }, [initialInvitados]);

  useEffect(() => {
    trackEvent("guests_page_viewed", { from_mission: fromMission });
  }, [fromMission]);

  useEffect(() => {
    if (!canalMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (!canalWrapRef.current?.contains(e.target as Node)) setCanalMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [canalMenuOpen]);

  const guestSteps = useMemo(() => getGuestMissionSteps(rows, eventoMeta), [rows, eventoMeta]);
  const pasajerosStrip = useMemo(() => guestMissionStripProps(guestSteps), [guestSteps]);
  const misionHint = useMemo(() => guestMissionDescriptionFromSteps(guestSteps), [guestSteps]);
  const totalPersonas = useMemo(() => totalPersonasEnLista(rows), [rows]);
  const metaInv = eventoMeta?.objetivo_invitaciones_enviar ?? null;
  const metaPer = eventoMeta?.objetivo_personas_total ?? null;

  const metricas = useInvitaciones(rows);
  const envio = useEnvioInvitaciones(eventoId, canal);

  const globalBusy = envio.busyScope === "global";
  const showStickyEnviar = Boolean(eventoId && metricas.pendiente > 0);

  const canalLabel: Record<CanalEnvioInvitacion, string> = {
    correo: "Correo",
    whatsapp: "WhatsApp",
    ambos: "Ambos",
  };

  const canalMenu = canalMenuOpen ? (
    <ul
      role="listbox"
      className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-white/10 bg-jurnex-bg py-1 shadow-lg md:left-auto md:right-0 md:w-auto md:min-w-[10rem]"
    >
      {(["correo", "whatsapp", "ambos"] as const).map((c) => (
        <li key={c}>
          <button
            type="button"
            role="option"
            aria-selected={canal === c}
            className="w-full px-3 py-2 text-left text-sm text-white/85 hover:bg-white/[0.06]"
            onClick={() => {
              setCanal(c);
              setCanalMenuOpen(false);
            }}
          >
            {canalLabel[c]}
          </button>
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <div className={showStickyEnviar ? "pb-[4.5rem] md:pb-0" : undefined}>
      <div className="mb-3 max-md:mb-4 md:mb-0">
        <div className="flex flex-col gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className={panelSectionTitleClass}>{PANEL_INVITADOS_TITLE}</h1>
            <p className={panelSectionSubtitleClass}>{PANEL_INVITADOS_SUBTITLE}</p>
          </div>

          {eventoId ? (
            <PanelMissionCard
              micro={misionHint}
              missionStrip={
                <JourneyMissionStrip
                  noTopRule
                  hideMisionesLabel
                  compact
                  {...pasajerosStrip}
                  ariaLabel="Misiones de invitados"
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

          {/* Botonera: debajo del resumen / misión */}
          <div className="flex w-full flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-end md:gap-2 lg:max-w-3xl lg:self-stretch">
            <div className="flex gap-2 md:contents">
              <div
                className="relative w-[min(42%,9.5rem)] shrink-0 md:w-auto md:min-w-[10rem]"
                ref={canalWrapRef}
              >
                <button
                  type="button"
                  onClick={() => setCanalMenuOpen((v) => !v)}
                  className="inline-flex h-10 w-full items-center justify-between gap-1.5 rounded-lg border border-white/[0.08] bg-black/20 px-2.5 text-left text-xs text-white/70 md:min-h-[40px] md:px-3 md:text-sm"
                  aria-expanded={canalMenuOpen}
                  aria-haspopup="listbox"
                >
                  <span className="text-white/40">Canal</span>
                  <span className="truncate font-medium text-white/80">{canalLabel[canal]}</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/35 md:h-4 md:w-4" aria-hidden />
                </button>
                {canalMenu}
              </div>
              <button
                type="button"
                disabled={globalBusy || !eventoId}
                onClick={() => void envio.enviarTodosPendientes(rows)}
                className={`${btnEnviarInvitaciones} min-h-[40px] min-w-0 flex-1 md:flex-initial`}
              >
                {globalBusy ? <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" aria-hidden /> : null}
                <span className="md:hidden">Enviar</span>
                <span className="hidden md:inline">Enviar invitaciones</span>
              </button>
            </div>

            <div className="flex gap-2 md:contents">
              <button
                type="button"
                id="invitados-btn-add"
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-white/10 bg-transparent px-3 py-2 text-xs font-medium text-white/85 transition hover:bg-white/[0.05] md:flex-initial md:px-4 md:py-2 md:text-sm"
                onClick={() => addInvitadoRef.current?.()}
              >
                <span className="md:hidden">+ Invitado</span>
                <span className="hidden md:inline">Añadir invitado</span>
              </button>
              <button
                type="button"
                id="invitados-btn-import"
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.06] md:flex-initial md:px-4 md:py-2 md:text-sm"
                onClick={() => importListRef.current?.()}
              >
                <span className="md:hidden">Importar</span>
                <span className="hidden md:inline">Importar lista</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 max-md:mt-4 md:mt-6">
        <InvitadosManager
          eventoId={eventoId}
          initialInvitados={initialInvitados}
          rows={rows}
          setRows={setRows}
          canalPreferido={canal}
          envio={envio}
          addInvitadoRef={addInvitadoRef}
          importListRef={importListRef}
        />
      </div>

      {showStickyEnviar ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-jurnex-bg/95 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
          <button
            type="button"
            disabled={globalBusy}
            onClick={() => void envio.enviarTodosPendientes(rows)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-500 py-3 text-sm font-semibold text-black shadow-sm shadow-teal-900/25 transition-colors hover:bg-teal-400 disabled:opacity-50"
          >
            {globalBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Enviar invitaciones
            <span className="tabular-nums text-black/70">({metricas.pendiente})</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
