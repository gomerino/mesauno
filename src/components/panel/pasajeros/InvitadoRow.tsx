"use client";

import type { Invitado } from "@/types/database";
import { JX } from "@/lib/jurnex-voz";
import { trackEvent } from "@/lib/analytics";
import { buildInvitationUrl, resolveInvitationToken } from "@/lib/invitation-url";
import {
  buildWhatsappInvitacionHref,
  isWhatsappAppDeepLinkPreferred,
} from "@/lib/invitacion-whatsapp-link";
import { ETIQUETA_ESTADO_LISTA, deriveEstadoListaInvitado, type EstadoListaInvitado } from "@/lib/panel-invitado-estado-lista";
import { nombresAcompanantes } from "@/lib/invitado-acompanantes";
import { Check, Link2, Loader2, Lock, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const PLAN_COPIA_ENLACE_BLOQUEADO =
  "Contrata un plan de pago para copiar o compartir el enlace de invitación.";

const clasesEstadoUnico: Record<EstadoListaInvitado, string> = {
  pendiente: "bg-white/10 text-white/80 ring-white/12",
  acepto: "bg-teal-500/20 text-teal-100 ring-teal-400/30",
  rechazo: "bg-rose-500/25 text-rose-100/95 ring-rose-400/30",
};

/** Un solo indicador: Pendiente, Aceptó, Rechazó (asistencia / RSVP). */
function InvitadoEstadoUnicaPill({ row, compact }: { row: Invitado; compact: boolean }) {
  const s = deriveEstadoListaInvitado(row);
  const label = ETIQUETA_ESTADO_LISTA[s];
  const size = compact
    ? "px-1.5 py-0.5 text-[10px] font-medium ring-1"
    : "px-2.5 py-0.5 text-[11px] font-semibold ring-1";
  return (
    <span
      className={`inline-flex max-w-full items-center justify-center rounded-full ${size} ${clasesEstadoUnico[s]}`}
    >
      {label}
    </span>
  );
}

type Props = {
  row: Invitado;
  siteOrigin: string;
  /** Plan Esencial o Experiencia pagado; si no, no se puede copiar el enlace desde la fila. */
  planPagado: boolean;
  onEdit: (row: Invitado) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
};

function InvitadoFilaAcciones({
  row,
  siteOrigin,
  planPagado,
  onEdit,
  onDelete,
  deletingId,
  variant,
}: {
  row: Invitado;
  siteOrigin: string;
  planPagado: boolean;
  onEdit: (row: Invitado) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  variant: "movil" | "tabla";
}) {
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);
  const copiadoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiadoTimerRef.current) clearTimeout(copiadoTimerRef.current);
    };
  }, []);

  const enlaceInvitacion = useMemo(
    () => buildInvitationUrl(resolveInvitationToken(row)),
    [row]
  );

  const copiarEnlace = useCallback(async () => {
    if (!planPagado) return;
    if (copiadoTimerRef.current) {
      clearTimeout(copiadoTimerRef.current);
      copiadoTimerRef.current = null;
    }
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(enlaceInvitacion);
      } else if (typeof document !== "undefined") {
        const ta = document.createElement("textarea");
        ta.value = enlaceInvitacion;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setEnlaceCopiado(true);
      copiadoTimerRef.current = setTimeout(() => {
        setEnlaceCopiado(false);
        copiadoTimerRef.current = null;
      }, 2000);
      toast.success(JX.copiado, { duration: 2000 });
      trackEvent("invite_link_copied", {
        source: "invitado_row",
        method: "copy",
        has_invitado_id: true,
      });
    } catch {
      toast.error(JX.copiadoFalla);
    }
  }, [enlaceInvitacion, planPagado]);

  const [preferWhatsappApp, setPreferWhatsappApp] = useState(false);
  useEffect(() => {
    setPreferWhatsappApp(isWhatsappAppDeepLinkPreferred());
  }, []);
  const wa = useMemo(
    () =>
      siteOrigin
        ? buildWhatsappInvitacionHref(row, siteOrigin, {
            target: preferWhatsappApp ? "app" : "https",
          })
        : null,
    [row, siteOrigin, preferWhatsappApp]
  );
  const del = deletingId === row.id;
  const copiaEnlaceBloqueada = !planPagado;
  const baseBtn =
    variant === "movil"
      ? "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-white/80 transition"
      : "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-white/80 transition sm:h-8 sm:min-w-[2rem]";

  return (
    <div
      className={
        variant === "movil" ? "flex items-center justify-end gap-0.5" : "inline-flex max-w-full flex-wrap items-center justify-end gap-1"
      }
    >
      <button
        type="button"
        disabled={copiaEnlaceBloqueada}
        onClick={() => void copiarEnlace()}
        className={
          baseBtn +
          (copiaEnlaceBloqueada
            ? " cursor-not-allowed border-white/5 bg-white/[0.02] text-white/25"
            : enlaceCopiado
              ? " border-teal-500/40 bg-teal-500/15 text-teal-200"
              : " border-teal-500/30 bg-teal-500/10 text-teal-200/95 hover:bg-teal-500/16")
        }
        title={copiaEnlaceBloqueada ? PLAN_COPIA_ENLACE_BLOQUEADO : "Copiar enlace de invitación"}
        aria-label={
          copiaEnlaceBloqueada
            ? PLAN_COPIA_ENLACE_BLOQUEADO
            : enlaceCopiado
              ? "Enlace copiado"
              : "Copiar enlace de invitación"
        }
      >
        {copiaEnlaceBloqueada ? (
          <Lock className="h-3.5 w-3.5 text-white/40" strokeWidth={2.25} aria-hidden />
        ) : enlaceCopiado ? (
          <Check className="h-3.5 w-3.5 text-teal-200" aria-hidden />
        ) : (
          <Link2 className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>
      {wa ? (
        <a
          href={wa}
          target={wa.startsWith("whatsapp://") ? "_self" : "_blank"}
          rel="noopener noreferrer"
          className={
            baseBtn + " border-teal-500/40 bg-teal-500/12 text-teal-100 hover:bg-teal-500/18"
          }
          title="Enviar por WhatsApp"
          aria-label="Enviar invitación por WhatsApp"
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden />
        </a>
      ) : (
        <button
          type="button"
          disabled
          className={baseBtn + " cursor-not-allowed border-white/5 bg-white/[0.02] text-white/20"}
          title="Sin teléfono para WhatsApp"
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
      <button
        type="button"
        onClick={() => onEdit(row)}
        className={
          baseBtn + " border-white/10 bg-white/[0.05] text-white/85 hover:bg-white/[0.09]"
        }
        title="Editar"
        aria-label="Editar invitado"
      >
        <Pencil className="h-3.5 w-3.5 text-journeyFiesta-gold/95" aria-hidden />
      </button>
      <button
        type="button"
        disabled={del}
        onClick={() => onDelete(row.id)}
        className={baseBtn + " border-rose-500/25 text-rose-200/90 hover:bg-rose-950/30 disabled:opacity-50"}
        title="Eliminar"
        aria-label="Eliminar invitado"
      >
        {del ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Trash2 className="h-3.5 w-3.5" aria-hidden />}
      </button>
    </div>
  );
}

export function InvitadoRow({ row, siteOrigin, planPagado, onEdit, onDelete, deletingId }: Props) {
  const acompanantes = nombresAcompanantes(row);

  return (
    <div className="md:hidden" data-invitado-row={row.id}>
      <div className="border-b border-white/[0.06] py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-tight text-white/90">{row.nombre_pasajero}</p>
          {acompanantes.length > 0 ? (
            <p className="mt-0.5 truncate text-[10px] leading-tight text-white/35">
              +{acompanantes.length} en la invitación
            </p>
          ) : null}
        </div>
        <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
          <div className="min-w-0 shrink" title="Asistencia (RSVP)">
            <InvitadoEstadoUnicaPill row={row} compact />
          </div>
          <InvitadoFilaAcciones
            row={row}
            siteOrigin={siteOrigin}
            planPagado={planPagado}
            onEdit={onEdit}
            onDelete={onDelete}
            deletingId={deletingId}
            variant="movil"
          />
        </div>
      </div>
    </div>
  );
}

/** Fila de escritorio: <table> con vertical-align: middle asegura alineación con filas con acompañante. */
export function InvitadoTableRow({
  row,
  siteOrigin,
  planPagado,
  onEdit,
  onDelete,
  deletingId,
}: Props) {
  const acompanantes = nombresAcompanantes(row);

  return (
    <tr className="border-b border-white/[0.06] transition-colors hover:bg-white/[0.02]" data-invitado-row={row.id}>
      <td className="align-top py-2 pl-1 pr-1">
        <p className="font-medium leading-snug text-white/90">{row.nombre_pasajero}</p>
        {acompanantes.map((n, i) => (
          <p key={i} className="mt-0.5 text-xs leading-snug text-white/45">
            + {n}
          </p>
        ))}
      </td>
      <td className="align-middle break-words py-2 pr-1 text-sm text-white/70">{row.email ?? "—"}</td>
      <td className="align-middle py-2 pr-1 text-sm text-white/70" title={row.telefono ?? undefined}>
        <span className="line-clamp-2">{row.telefono ?? "—"}</span>
      </td>
      <td className="px-0.5 align-middle py-2 text-center" title="Asistencia (RSVP)">
        <div className="inline-flex w-full min-w-0 justify-center">
          <InvitadoEstadoUnicaPill row={row} compact={false} />
        </div>
      </td>
      <td className="align-middle py-2 pr-1">
        <div className="flex justify-end">
          <InvitadoFilaAcciones
            row={row}
            siteOrigin={siteOrigin}
            planPagado={planPagado}
            onEdit={onEdit}
            onDelete={onDelete}
            deletingId={deletingId}
            variant="tabla"
          />
        </div>
      </td>
    </tr>
  );
}
