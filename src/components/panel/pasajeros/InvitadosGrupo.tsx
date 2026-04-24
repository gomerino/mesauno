"use client";

import { InvitadoRow } from "@/components/panel/pasajeros/InvitadoRow";
import type { Invitado } from "@/types/database";
import type { CanalEnvioInvitacion } from "@/types/database";
import { resumenMesaRsvp } from "@/lib/invitado-mesa-rsvp";
import { deriveEstadoEnvio } from "@/lib/invitado-estado-envio";
import { ChevronDown, Loader2, RefreshCw, Send } from "lucide-react";
import { useMemo } from "react";

type Props = {
  mesaKey: string;
  label: string;
  invitados: Invitado[];
  isOpen: boolean;
  onToggle: () => void;
  canalPreferido: CanalEnvioInvitacion;
  busyScope: string | null;
  onEnviarGrupo: (mesaKey: string, ids: string[]) => void;
  onReenviarGrupo: (mesaKey: string, ids: string[]) => void;
  onEnviarRow: (id: string) => void;
  onReenviarRow: (id: string) => void;
  onEdit: (row: Invitado) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
};

export function InvitadosGrupo({
  mesaKey,
  label,
  invitados,
  isOpen,
  onToggle,
  canalPreferido,
  busyScope,
  onEnviarGrupo,
  onReenviarGrupo,
  onEnviarRow,
  onReenviarRow,
  onEdit,
  onDelete,
  deletingId,
}: Props) {
  const { confirmados, noAsistire, pendienteRespuesta, total } = useMemo(
    () => resumenMesaRsvp(invitados),
    [invitados]
  );
  /** Respuestas de asistencia cerradas (sí o no) respecto al total. */
  const rsvpCerrados = confirmados + noAsistire;
  const progressPct = total > 0 ? Math.min(100, Math.round((rsvpCerrados / total) * 1000) / 10) : 0;

  const idsPendienteEnvio = useMemo(
    () => invitados.filter((r) => deriveEstadoEnvio(r) === "pendiente").map((r) => r.id),
    [invitados]
  );
  const idsReenvio = useMemo(
    () =>
      invitados
        .filter((r) => {
          const e = deriveEstadoEnvio(r);
          return e === "enviado" || e === "abierto";
        })
        .map((r) => r.id),
    [invitados]
  );

  const mesaBusy = busyScope === `mesa:${mesaKey}`;

  return (
    <section
      className="overflow-hidden rounded-xl border border-white/10 bg-black/20"
      aria-label={label}
    >
      <div className="flex flex-col gap-2 border-b border-white/[0.06] px-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-start gap-2 text-left transition hover:bg-white/[0.02] sm:items-center sm:gap-3"
        >
          <ChevronDown
            className={`mt-0.5 h-4 w-4 shrink-0 text-white/45 transition-transform sm:mt-0 sm:h-5 sm:w-5 ${isOpen ? "rotate-180" : ""}`}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white/90 sm:text-base">{label}</p>
            <p className="mt-0.5 hidden text-xs text-white/55 sm:block">
              {confirmados} sí · {noAsistire} no asistiré · {pendienteRespuesta} asist. pend.
            </p>
            <p className="mt-0.5 text-[11px] text-white/50 sm:hidden">
              {confirmados} sí · {noAsistire} no
            </p>
            <div
              className="mt-2 hidden h-1.5 max-w-md overflow-hidden rounded-full bg-white/10 sm:block"
              aria-hidden
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-[#F5C451] transition-[width]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </button>
        <div className="flex shrink-0 items-center justify-end gap-1.5 pl-7 sm:gap-2 sm:pl-0">
          <button
            type="button"
            disabled={idsPendienteEnvio.length === 0 || mesaBusy}
            onClick={(e) => {
              e.stopPropagation();
              onEnviarGrupo(mesaKey, idsPendienteEnvio);
            }}
            aria-label="Enviar a la mesa"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/90 transition hover:bg-white/[0.09] disabled:pointer-events-none disabled:opacity-40 sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3 sm:py-2"
          >
            {mesaBusy ? (
              <Loader2 className="h-4 w-4 animate-spin sm:h-3.5 sm:w-3.5" aria-hidden />
            ) : (
              <Send className="h-4 w-4 sm:hidden" aria-hidden />
            )}
            <span className="hidden text-xs font-medium sm:inline">Enviar</span>
          </button>
          <button
            type="button"
            disabled={idsReenvio.length === 0 || mesaBusy}
            onClick={(e) => {
              e.stopPropagation();
              onReenviarGrupo(mesaKey, idsReenvio);
            }}
            aria-label="Reenviar en la mesa"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-transparent text-white/75 transition hover:bg-white/[0.05] disabled:pointer-events-none disabled:opacity-40 sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3 sm:py-2"
          >
            {mesaBusy ? (
              <Loader2 className="h-4 w-4 animate-spin sm:h-3.5 sm:w-3.5" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4 sm:hidden" aria-hidden />
            )}
            <span className="hidden text-xs font-medium sm:inline">Reenviar</span>
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="px-2 pb-4 pt-2 sm:px-3">
          <div className="mb-2 hidden border-b border-white/10 px-1 pb-2 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_auto_auto_auto] md:gap-x-2 md:text-[10px] md:font-semibold md:uppercase md:tracking-wider md:text-white/40">
            <span>Nombre</span>
            <span>Correo</span>
            <span>Teléfono</span>
            <span className="text-center">Invit. / asist.</span>
            <span className="text-center">Canal</span>
            <span className="text-right pr-2">Acciones</span>
          </div>
          <div className="space-y-2 md:space-y-0">
            {invitados.map((row) => (
              <InvitadoRow
                key={row.id}
                row={row}
                canalPreferido={canalPreferido}
                busyScope={busyScope}
                onEnviar={onEnviarRow}
                onReenviar={onReenviarRow}
                onEdit={onEdit}
                onDelete={onDelete}
                deletingId={deletingId}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
