"use client";

import type { CanalEnvioInvitacion, Invitado } from "@/types/database";
import { deriveEstadoEnvio } from "@/lib/invitado-estado-envio";
import { nombresAcompanantes } from "@/lib/invitado-acompanantes";
import { hasCompletedRsvp, isAsistenciaRespuestaCerrada } from "@/lib/rsvp-ui-state";
import { Loader2, Mail, MessageCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function estadoBadge(estado: ReturnType<typeof deriveEstadoEnvio>, compact?: boolean) {
  const map: Record<
    ReturnType<typeof deriveEstadoEnvio>,
    { label: string; className: string }
  > = {
    pendiente: { label: "Pendiente", className: "bg-white/10 text-white/75 ring-white/10" },
    enviado: { label: "Enviado", className: "bg-blue-500/20 text-blue-200 ring-blue-400/25" },
    abierto: { label: "Abierto", className: "bg-amber-500/20 text-amber-100 ring-amber-400/25" },
    confirmado: { label: "Confirmado", className: "bg-emerald-500/20 text-emerald-100 ring-emerald-400/25" },
  };
  const m = map[estado];
  const size = compact ? "px-1.5 py-0 text-[10px] ring-1" : "px-2 py-0.5 text-[11px] font-medium ring-1";
  return (
    <span className={`inline-flex max-w-full items-center rounded-full ${size} ${m.className}`}>{m.label}</span>
  );
}

/** Segunda pastilla: respuesta a la asistencia (independiente del flujo de envío). */
function rsvpAsistenciaBadge(row: Pick<Invitado, "rsvp_estado" | "asistencia_confirmada">, compact?: boolean) {
  const size = compact ? "px-1.5 py-0 text-[9px] ring-1" : "px-2 py-0.5 text-[10px] font-medium ring-1";
  if (row.rsvp_estado === "declinado") {
    return (
      <span
        className={`inline-flex max-w-full items-center rounded-full ${size} bg-rose-500/25 text-rose-100/95 ring-rose-400/30`}
        title="No asistirá (RSVP)"
      >
        {compact ? "No" : "No asistiré"}
      </span>
    );
  }
  if (row.rsvp_estado === "confirmado" || row.asistencia_confirmada) {
    return (
      <span
        className={`inline-flex max-w-full items-center rounded-full ${size} bg-emerald-500/20 text-emerald-100 ring-emerald-400/30`}
        title="Confirmó asistencia (RSVP)"
      >
        {compact ? "Sí" : "Sí, asistiré"}
      </span>
    );
  }
  if (!hasCompletedRsvp(row.rsvp_estado)) {
    return (
      <span
        className={`inline-flex max-w-full items-center rounded-full ${size} bg-white/[0.08] text-white/60 ring-white/10`}
        title="Sin respuesta o pendiente (RSVP)"
      >
        {compact ? "Asist.?" : "Asist. pend."}
      </span>
    );
  }
  return null;
}

type EstadoEnv = ReturnType<typeof deriveEstadoEnvio>;

/** Un solo foco: si asist. cerrada, solo RSVP; si envío aún no sale, no sumamos “Asist. pend.”. */
function InvitadoEstadoCelda({
  row,
  estado,
  compact,
  align = "end",
}: {
  row: Invitado;
  estado: EstadoEnv;
  compact: boolean;
  align?: "end" | "center";
}) {
  if (isAsistenciaRespuestaCerrada(row)) {
    return rsvpAsistenciaBadge(row, compact);
  }
  if (estado === "pendiente") {
    return estadoBadge(estado, compact);
  }
  const pack = (
    <div
      className={
        align === "end" ? "flex flex-col items-end gap-0.5" : "flex flex-col items-center gap-0.5"
      }
    >
      {estadoBadge(estado, compact)}
      {rsvpAsistenciaBadge(row, compact)}
    </div>
  );
  return pack;
}

function CanalIcons({ canal, compact }: { canal: CanalEnvioInvitacion; compact?: boolean }) {
  const iconCls = compact ? "h-3.5 w-3.5 text-white/50" : "h-4 w-4 text-white/55";
  if (canal === "correo") return <Mail className={iconCls} aria-hidden />;
  if (canal === "whatsapp") return <MessageCircle className={iconCls} aria-hidden />;
  return (
    <span className="flex items-center gap-1" aria-hidden>
      <Mail className={iconCls} />
      <MessageCircle className={iconCls} />
    </span>
  );
}

type Props = {
  row: Invitado;
  canalPreferido: CanalEnvioInvitacion;
  busyScope: string | null;
  onEnviar: (id: string) => void;
  onReenviar: (id: string) => void;
  onEdit: (row: Invitado) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
};

export function InvitadoRow({
  row,
  canalPreferido,
  busyScope,
  onEnviar,
  onReenviar,
  onEdit,
  onDelete,
  deletingId,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const estado = deriveEstadoEnvio(row);
  const canalMostrado = row.canal_envio ?? canalPreferido;
  const rowBusy = busyScope === `row:${row.id}`;

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const showEnviar = estado === "pendiente";
  const showReenviar = estado === "enviado" || estado === "abierto";

  const acompanantes = nombresAcompanantes(row);

  return (
    <div ref={rootRef}>
      {/* Móvil: fila densa (contacto completo en Editar) */}
      <div className="border-b border-white/[0.06] py-1.5 md:hidden">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight text-white/90">{row.nombre_pasajero}</p>
            {acompanantes.length > 0 ? (
              <p className="truncate text-[10px] leading-tight text-white/35">+{acompanantes.length} en la invitación</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5" title="Invitación / RSVP">
            <InvitadoEstadoCelda row={row} estado={estado} compact align="end" />
          </div>
          <div className="shrink-0" title="Canal">
            <CanalIcons canal={canalMostrado} compact />
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {showEnviar ? (
              <button
                type="button"
                disabled={rowBusy}
                onClick={() => onEnviar(row.id)}
                className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] font-medium text-white/85 disabled:opacity-50"
              >
                {rowBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Enviar"}
              </button>
            ) : null}
            {showReenviar ? (
              <button
                type="button"
                disabled={rowBusy}
                onClick={() => onReenviar(row.id)}
                className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-medium text-white/75 disabled:opacity-50"
              >
                {rowBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reenviar"}
              </button>
            ) : null}
            <div className="relative">
              <button
                type="button"
                aria-label="Más opciones"
                className="rounded-md p-1 text-white/50 hover:bg-white/[0.06] hover:text-white"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen ? (
                <ul
                  role="menu"
                  className="absolute right-0 top-full z-[100] mt-1 min-w-[10rem] rounded-lg border border-white/10 bg-jurnex-bg py-1 shadow-lg"
                >
                  <li>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/85 hover:bg-white/[0.05]"
                      onClick={() => {
                        onEdit(row);
                        setMenuOpen(false);
                      }}
                    >
                      <Pencil className="h-4 w-4 text-[#F5C451]/90" aria-hidden />
                      Editar
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={deletingId === row.id}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-200/90 hover:bg-red-950/30 disabled:opacity-50"
                      onClick={() => {
                        onDelete(row.id);
                        setMenuOpen(false);
                      }}
                    >
                      {deletingId === row.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Trash2 className="h-4 w-4" aria-hidden />
                      )}
                      Eliminar
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Escritorio */}
      <div
        className="group relative hidden md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_auto_auto_auto] md:gap-x-2 md:border-b md:border-white/[0.06] md:px-2"
        role="row"
      >
        <div className="flex min-w-0 items-center py-2 pl-1">
          <div>
            <p className="font-medium text-white/90">{row.nombre_pasajero}</p>
            {acompanantes.map((n, i) => (
              <p key={i} className="mt-0.5 text-xs text-white/45">
                + {n}
              </p>
            ))}
          </div>
        </div>
        <div className="flex min-w-0 items-center break-words py-2 text-sm text-white/70">{row.email ?? "—"}</div>
        <div className="flex items-center truncate py-2 text-sm text-white/70" title={row.telefono ?? undefined}>
          {row.telefono ?? "—"}
        </div>
        <div className="flex flex-col items-center justify-center py-2" title="Invitación / RSVP de asistencia">
          <InvitadoEstadoCelda row={row} estado={estado} compact={false} align="center" />
        </div>
        <div className="flex items-center justify-center py-2">
          <CanalIcons canal={canalMostrado} />
        </div>
        <div className="flex items-center justify-end gap-1 py-1.5 pr-1">
          <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {showEnviar ? (
              <button
                type="button"
                disabled={rowBusy}
                onClick={(e) => {
                  e.stopPropagation();
                  onEnviar(row.id);
                }}
                className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-[11px] font-medium text-white/85 hover:bg-white/[0.1] disabled:opacity-50"
              >
                {rowBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Enviar"}
              </button>
            ) : null}
            {showReenviar ? (
              <button
                type="button"
                disabled={rowBusy}
                onClick={(e) => {
                  e.stopPropagation();
                  onReenviar(row.id);
                }}
                className="rounded-md border border-white/10 px-2 py-1 text-[11px] font-medium text-white/75 hover:bg-white/[0.05] disabled:opacity-50"
              >
                {rowBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reenviar"}
              </button>
            ) : null}
          </span>
          <div className="relative">
            <button
              type="button"
              aria-label="Más opciones"
              className="rounded-md p-1.5 text-white/45 hover:bg-white/[0.06] hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen ? (
              <ul
                role="menu"
                className="absolute right-0 top-full z-[100] mt-1 min-w-[10rem] rounded-lg border border-white/10 bg-jurnex-bg py-1 shadow-lg"
              >
                <li>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/85 hover:bg-white/[0.05]"
                    onClick={() => {
                      onEdit(row);
                      setMenuOpen(false);
                    }}
                  >
                    <Pencil className="h-4 w-4 text-[#F5C451]/90" aria-hidden />
                    Editar
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    disabled={deletingId === row.id}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-200/90 hover:bg-red-950/30 disabled:opacity-50"
                    onClick={() => {
                      onDelete(row.id);
                      setMenuOpen(false);
                    }}
                  >
                    {deletingId === row.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden />
                    )}
                    Eliminar
                  </button>
                </li>
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
