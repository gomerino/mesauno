"use client";

import { Card } from "@/components/jurnex-ui";
import { InvitadosRowActionsMenu } from "@/components/panel/InvitadosRowActionsMenu";
import type { Invitado } from "@/types/database";
import { nombresAcompanantes } from "@/lib/invitado-acompanantes";
import { restriccionesFromDb } from "@/lib/restricciones-alimenticias";
import { Fragment, memo, useMemo } from "react";

/** Misma plantilla en cabecera, subfilas RSVP y filas de invitado (columna acciones 140px fija). */
export const INVITADOS_DESKTOP_GRID =
  "grid grid-cols-[2fr_2fr_1fr_2fr_140px] gap-x-2";

export const InvitadoMesaMobileCard = memo(function InvitadoMesaMobileCard({
  row,
  sendingId,
  deletingId,
  onEdit,
  onDelete,
  onSendEmail,
}: {
  row: Invitado;
  sendingId: string | null;
  deletingId: string | null;
  onEdit: (row: Invitado) => void;
  onDelete: (id: string) => void;
  onSendEmail: (id: string) => void;
}) {
  const restriccionesTexto = useMemo(
    () => restriccionesFromDb(row.restricciones_alimenticias).trim(),
    [row.restricciones_alimenticias]
  );

  return (
    <Card
      padded={false}
      className="overflow-hidden !border-white/10 !bg-black/30 p-0 !shadow-none"
    >
      <div className="border-b border-white/10 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-base font-semibold text-white/90">{row.nombre_pasajero}</p>
          {nombresAcompanantes(row).map((n, i) => (
            <p key={`${i}-${n}`} className="mt-1 text-xs text-white/50">
              + {n}
            </p>
          ))}
        </div>
      </div>
      <div className="space-y-2.5 px-3 py-2.5 text-xs">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Correo</p>
          <p className="mt-0.5 break-words text-white/70">{row.email ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Teléfono</p>
          <p className="mt-0.5 text-white/70">{row.telefono ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
            Restricciones
          </p>
          <p className="mt-0.5 line-clamp-3 text-white/60">{restriccionesTexto || "—"}</p>
        </div>
      </div>
      <div
        className="flex justify-end border-t border-white/10 bg-black/20 px-2 py-2"
        onClick={(e) => e.stopPropagation()}
      >
        <InvitadosRowActionsMenu
          row={row}
          variant="card"
          sendingId={sendingId}
          deletingId={deletingId}
          onEdit={onEdit}
          onDelete={onDelete}
          onSendEmail={onSendEmail}
        />
      </div>
    </Card>
  );
});

export const InvitadoMesaDesktopBlock = memo(function InvitadoMesaDesktopBlock({
  row,
  isExpanded,
  isNewHighlight,
  onToggleExpand,
  sendingId,
  deletingId,
  onEdit,
  onDelete,
  onSendEmail,
}: {
  row: Invitado;
  isExpanded: boolean;
  isNewHighlight: boolean;
  onToggleExpand: (id: string) => void;
  sendingId: string | null;
  deletingId: string | null;
  onEdit: (row: Invitado) => void;
  onDelete: (id: string) => void;
  onSendEmail: (id: string) => void;
}) {
  const restriccionesTexto = useMemo(
    () => restriccionesFromDb(row.restricciones_alimenticias).trim(),
    [row.restricciones_alimenticias]
  );

  const showActionsAlways =
    sendingId === row.id || deletingId === row.id;

  return (
    <Fragment>
      <div className="w-full">
        <div
          role="row"
          className={`${INVITADOS_DESKTOP_GRID} group cursor-pointer border-b border-white/5 transition-colors duration-150 ease-out hover:bg-white/[0.02] focus-within:bg-white/[0.02] ${isExpanded ? "bg-white/[0.03]" : ""} ${isNewHighlight ? "animate-rsvpReveal" : ""}`}
          onClick={() => onToggleExpand(row.id)}
        >
          <div className="min-w-0 py-1.5 pl-7 pr-2 font-medium text-white/90">
            <span className="block leading-snug">{row.nombre_pasajero}</span>
            {nombresAcompanantes(row).map((n, i) => (
              <span
                key={`${i}-${n}`}
                className="mt-1 block text-xs font-normal leading-snug text-white/50"
              >
                + {n}
              </span>
            ))}
          </div>
          <div className="min-w-0 break-words py-2 pr-2 text-sm text-white/70">
            {row.email ?? "—"}
          </div>
          <div className="min-w-0 truncate py-2 pr-2 text-sm text-white/70" title={row.telefono ?? undefined}>
            {row.telefono ?? "—"}
          </div>
          <div
            className="min-w-0 py-2 pr-2 text-sm text-white/50"
            title={restriccionesTexto || undefined}
          >
            <span className="line-clamp-2 break-words">{restriccionesTexto || "—"}</span>
          </div>
          <div
            className="relative flex h-10 w-[140px] max-w-[140px] shrink-0 items-center justify-end border-l border-white/10 py-1 pl-2"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className={`pointer-events-none absolute right-2 text-base leading-none text-white/40 transition-opacity duration-150 ${
                showActionsAlways ? "opacity-0" : "opacity-100 group-hover:opacity-0 group-focus-within:opacity-0"
              }`}
              aria-hidden
            >
              ⋯
            </span>
            <div
              className={`relative z-10 flex justify-end transition-all duration-150 ${
                showActionsAlways
                  ? "pointer-events-auto scale-100 opacity-100"
                  : "pointer-events-none scale-95 opacity-0 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:scale-100 group-focus-within:opacity-100"
              }`}
            >
              <InvitadosRowActionsMenu
                row={row}
                variant="table"
                sendingId={sendingId}
                deletingId={deletingId}
                onEdit={onEdit}
                onDelete={onDelete}
                onSendEmail={onSendEmail}
              />
            </div>
          </div>
        </div>
        {isExpanded ? (
          <div className="animate-fadeIn border-b border-white/5 bg-black/30 px-6 py-2.5 text-sm leading-relaxed text-white/60">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-jurnex-secondary/75">
              Detalle
            </p>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-jurnex-text-muted">Correo</dt>
                <dd className="mt-0.5 break-words text-jurnex-text-primary">
                  {row.email ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-jurnex-text-muted">Teléfono</dt>
                <dd className="mt-0.5 text-jurnex-text-primary">{row.telefono ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-jurnex-text-muted">Restricciones</dt>
                <dd className="mt-0.5 text-jurnex-text-secondary">
                  {restriccionesTexto || "—"}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-jurnex-text-muted">
              Clic en la fila para cerrar este panel.
            </p>
          </div>
        ) : null}
      </div>
    </Fragment>
  );
});
