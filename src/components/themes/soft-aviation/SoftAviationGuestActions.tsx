"use client";

import { useAviationInvitacionVariant } from "@/components/themes/AviationInvitacionContext";
import { restriccionesFromDb } from "@/lib/restricciones-alimenticias";
import { guestSeatSummaryLine } from "@/lib/guest-boarding-meta";
import type { Evento, Invitado } from "@/types/database";
import { rsvpUiStateFromDb, type RsvpUiState } from "@/lib/rsvp-ui-state";
import { useCallback, useEffect, useState } from "react";
import { SoftAviationCheckInFlow } from "./SoftAviationCheckInFlow";

type DbRsvp = "confirmado" | "declinado" | "pendiente";

type Props = {
  invitadoId: string;
  invitado: Invitado;
  evento: Evento | null;
  initialEstado: string | null;
  restriccionesRaw: string | string[] | null | undefined;
  spotifyPlaylistUrl: string | null;
  /** `embedded`: botón en flujo (debajo del hub de pestañas). `fixed`: barra fija al viewport. */
  footerMode?: "fixed" | "embedded";
  /**
   * En invitación móvil el dock (iconos) va en el flujo al pie; la CTA fija se sube
   * para no tapar los micro de la barra.
   */
  fixedAboveMobileDock?: boolean;
  onRsvpEstadoChange?: (estado: string | null) => void;
};

export function SoftAviationGuestActions({
  invitadoId,
  invitado,
  evento,
  initialEstado,
  restriccionesRaw,
  spotifyPlaylistUrl,
  footerMode = "fixed",
  fixedAboveMobileDock = false,
  onRsvpEstadoChange,
}: Props) {
  const aviation = useAviationInvitacionVariant();
  const isJx = aviation === "jurnex";
  const [open, setOpen] = useState(false);
  const [flowMode, setFlowMode] = useState<"create" | "edit">("create");
  const [rsvpEstado, setRsvpEstado] = useState<string | null>(initialEstado);
  const embedded = footerMode === "embedded";

  useEffect(() => {
    setRsvpEstado(initialEstado);
  }, [initialEstado]);

  const ui: RsvpUiState = rsvpUiStateFromDb(rsvpEstado);
  const destinoSummary = guestSeatSummaryLine(invitado, evento);
  const compactConfirmedDock = fixedAboveMobileDock && !embedded && ui === "confirmed";

  const notifyParent = useCallback(
    (estado: string | null) => {
      onRsvpEstadoChange?.(estado);
    },
    [onRsvpEstadoChange]
  );

  const handleRsvpSaved = useCallback(
    (estado: DbRsvp) => {
      setRsvpEstado(estado);
      notifyParent(estado);
    },
    [notifyParent]
  );

  const openCreate = useCallback(() => {
    setFlowMode("create");
    setOpen(true);
  }, []);

  const openEdit = useCallback(() => {
    setFlowMode("edit");
    setOpen(true);
  }, []);

  const primaryCtaClass = isJx
    ? "w-full rounded-full bg-inviteJurnex-gold py-3 text-center text-sm font-semibold text-inviteJurnex-navy shadow-sm transition hover:brightness-105 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inviteJurnex-navy/30 focus-visible:ring-offset-2"
    : "w-full rounded-full bg-invite-gold py-3 text-center text-sm font-semibold text-invite-navy shadow-sm transition hover:brightness-105 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-invite-navy/30 focus-visible:ring-offset-2";
  const bodyText = isJx ? "text-inviteJurnex-navy" : "text-invite-navy";
  const bodyTextMuted = isJx ? "text-inviteJurnex-navy/80" : "text-invite-navy/80";
  const bottomForDock = fixedAboveMobileDock ? "max-md:bottom-[4.75rem] md:bottom-0" : "bottom-0";
  const barShell = isJx
    ? `fixed inset-x-0 z-aviation-cta-8900 ${bottomForDock} border-t border-inviteJurnex-navy/8 bg-inviteJurnex-sand/95 text-inviteJurnex-navy shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-inviteJurnex-sand/90 ${
        compactConfirmedDock
          ? "px-3 py-2 pb-[max(0.55rem,env(safe-area-inset-bottom,0px))]"
          : "px-4 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2.5"
      }`
    : `fixed inset-x-0 z-aviation-cta-8900 ${bottomForDock} border-t border-invite-navy/8 bg-invite-sand/95 text-invite-navy shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-invite-sand/85 ${
        compactConfirmedDock
          ? "px-3 py-2 pb-[max(0.55rem,env(safe-area-inset-bottom,0px))]"
          : "px-4 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2.5"
      }`;

  const ctaBlock = (
    <div className={compactConfirmedDock ? "flex items-center justify-between gap-3" : "space-y-3"}>
      {ui === "pending" && (
        <button type="button" onClick={openCreate} className={primaryCtaClass}>
          Confirma tu asistencia <span aria-hidden>✈️</span>
        </button>
      )}

      {ui === "confirmed" && compactConfirmedDock && (
        <>
          <div className="min-w-0">
            <p className={`truncate text-[12px] font-semibold leading-tight ${bodyText}`}>Pase validado</p>
            <p className={`truncate text-[11px] leading-tight ${bodyTextMuted}`}>
              {destinoSummary !== "tu lugar" ? "Mesa reservada" : "Te esperamos a bordo"}
            </p>
          </div>
          <button
            type="button"
            onClick={openEdit}
            className={
              isJx
                ? "shrink-0 rounded-full bg-inviteJurnex-gold px-4 py-2 text-xs font-semibold text-inviteJurnex-navy shadow-sm transition hover:brightness-105 active:scale-[0.99]"
                : "shrink-0 rounded-full bg-invite-gold px-4 py-2 text-xs font-semibold text-invite-navy shadow-sm transition hover:brightness-105 active:scale-[0.99]"
            }
          >
            Editar
          </button>
        </>
      )}

      {ui === "confirmed" && !compactConfirmedDock && (
        <div className="space-y-3 animate-rsvpReveal motion-reduce:animate-none">
          <div className="text-center">
            <p className={`text-[13px] font-semibold leading-snug ${bodyText}`}>Todo listo, te esperamos a bordo</p>
            {destinoSummary !== "tu lugar" ? (
              <p className={`mt-1.5 text-[12px] leading-snug ${bodyTextMuted}`}>Tu mesa está reservada</p>
            ) : null}
          </div>
          <button type="button" onClick={openEdit} className={primaryCtaClass}>
            Editar asistencia
          </button>
        </div>
      )}

      {ui === "declined" && (
        <>
          <p className={`text-center text-[13px] font-semibold leading-snug ${bodyText}`}>
            <span aria-hidden>❌</span> No podrás asistir
          </p>
          <button type="button" onClick={openCreate} className={primaryCtaClass}>
            Cambiar respuesta
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      {!open ? (
        embedded ? (
          <div className={bodyText}>{ctaBlock}</div>
        ) : (
          <div className={barShell}>
            {ctaBlock}
          </div>
        )
      ) : null}

      {open ? (
        <SoftAviationCheckInFlow
          invitadoId={invitadoId}
          initialEstado={rsvpEstado ?? initialEstado}
          initialRestricciones={restriccionesFromDb(restriccionesRaw)}
          fechaEvento={evento?.fecha_evento}
          planKind={evento?.plan ?? null}
          spotifyPlaylistUrl={spotifyPlaylistUrl}
          flowMode={flowMode}
          onClose={() => setOpen(false)}
          onRsvpSaved={handleRsvpSaved}
        />
      ) : null}
    </>
  );
}
