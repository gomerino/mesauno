"use client";

import { InvitadoRow, InvitadoTableRow } from "@/components/panel/pasajeros/InvitadoRow";
import type { Invitado } from "@/types/database";
import { resumenMesaRsvp } from "@/lib/invitado-mesa-rsvp";
import { ChevronDown } from "lucide-react";
import { useMemo } from "react";

type Props = {
  label: string;
  invitados: Invitado[];
  isOpen: boolean;
  onToggle: () => void;
  siteOrigin: string;
  planPagado: boolean;
  onEdit: (row: Invitado) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
};

export function InvitadosGrupo({
  label,
  invitados,
  isOpen,
  onToggle,
  siteOrigin,
  planPagado,
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

  return (
    <section className="rounded-xl border border-white/10 bg-black/20" aria-label={label}>
      <div className="border-b border-white/[0.06] px-2 py-2 sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full min-w-0 items-start gap-2 text-left transition hover:bg-white/[0.02] sm:items-center sm:gap-3"
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
                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-journeyFiesta-gold transition-[width]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </button>
      </div>

      {isOpen ? (
        <div className="px-2 pb-4 pt-2 sm:px-3">
          <div className="space-y-2 md:hidden">
            {invitados.map((row) => (
              <InvitadoRow
                key={row.id}
                row={row}
                siteOrigin={siteOrigin}
                planPagado={planPagado}
                onEdit={onEdit}
                onDelete={onDelete}
                deletingId={deletingId}
              />
            ))}
          </div>
          <div className="hidden min-w-0 overflow-x-auto md:block">
            <table className="w-full min-w-[36rem] table-fixed border-collapse text-left">
              <caption className="sr-only">Invitados de {label}</caption>
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  <th scope="col" className="w-[32%] pl-1 pb-2 pr-1 text-left font-normal">
                    Nombre
                  </th>
                  <th scope="col" className="w-[24%] pb-2 pr-1 font-normal">
                    Correo
                  </th>
                  <th scope="col" className="w-[18%] pb-2 pr-1 font-normal">
                    Teléfono
                  </th>
                  <th scope="col" className="w-[9%] pb-2 text-center font-normal">
                    Estado
                  </th>
                  <th scope="col" className="w-[19%] min-w-[9rem] pb-2 pr-2 text-right font-normal">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {invitados.map((row) => (
                  <InvitadoTableRow
                    key={row.id}
                    row={row}
                    siteOrigin={siteOrigin}
                    planPagado={planPagado}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    deletingId={deletingId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
