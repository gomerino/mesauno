"use client";

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
  /** `embedded`: botón en flujo (debajo del hub de pestañas). `fixed`: barra fija al viewport (legacy). */
  footerMode?: "fixed" | "embedded";
  onRsvpEstadoChange?: (estado: string | null) => void;
  /** Si true y la asistencia ya está confirmada, no se muestra el resumen ni “Editar asistencia” (gran día). */
  isEventDay?: boolean;
};

export function SoftAviationGuestActions({
  invitadoId,
  invitado,
  evento,
  initialEstado,
  restriccionesRaw,
  spotifyPlaylistUrl,
  footerMode = "fixed",
  onRsvpEstadoChange,
  isEventDay = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [flowMode, setFlowMode] = useState<"create" | "edit">("create");
  const [rsvpEstado, setRsvpEstado] = useState<string | null>(initialEstado);
  const embedded = footerMode === "embedded";

  useEffect(() => {
    setRsvpEstado(initialEstado);
  }, [initialEstado]);

  const ui: RsvpUiState = rsvpUiStateFromDb(rsvpEstado);
  const destinoSummary = guestSeatSummaryLine(invitado, evento);
  const hideConfirmedChrome = ui === "confirmed" && isEventDay;

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

  const primaryCtaClass =
    "w-full rounded-full bg-[#D4AF37] py-3 text-center text-sm font-semibold text-[#1A2B48] shadow-sm transition hover:brightness-105 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A2B48]/30 focus-visible:ring-offset-2";

  const ctaBlock = (
    <div className="space-y-3">
      {ui === "pending" && (
        <button type="button" onClick={openCreate} className={primaryCtaClass}>
          Confirma tu asistencia <span aria-hidden>✈️</span>
        </button>
      )}

      {ui === "confirmed" && !hideConfirmedChrome && (
        <div className="space-y-3 animate-rsvpReveal motion-reduce:animate-none">
          <div className="text-center">
            <p className="text-[13px] font-semibold leading-snug text-[#1A2B48]">Todo listo, te esperamos a bordo</p>
            {destinoSummary !== "tu lugar" ? (
              <p className="mt-1.5 text-[12px] leading-snug text-[#1A2B48]/80">Tu mesa está reservada</p>
            ) : null}
          </div>
          <button type="button" onClick={openEdit} className={primaryCtaClass}>
            Editar asistencia
          </button>
        </div>
      )}

      {ui === "declined" && (
        <>
          <p className="text-center text-[13px] font-semibold leading-snug text-[#1A2B48]">
            <span aria-hidden>❌</span> No podrás asistir
          </p>
          <button type="button" onClick={openCreate} className={primaryCtaClass}>
            Cambiar respuesta
          </button>
        </>
      )}
    </div>
  );

  if (hideConfirmedChrome) {
    return open ? (
      <SoftAviationCheckInFlow
        invitadoId={invitadoId}
        initialEstado={rsvpEstado ?? initialEstado}
        initialRestricciones={restriccionesFromDb(restriccionesRaw)}
        spotifyPlaylistUrl={spotifyPlaylistUrl}
        flowMode={flowMode}
        onClose={() => setOpen(false)}
        onRsvpSaved={handleRsvpSaved}
      />
    ) : null;
  }

  return (
    <>
      {embedded ? (
        <div className="text-[#1A2B48]">{ctaBlock}</div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 z-[8900] border-t border-[#1A2B48]/8 bg-[#F4F1EA]/95 px-4 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2.5 text-[#1A2B48] shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-[#F4F1EA]/85">
          {ctaBlock}
        </div>
      )}

      {open ? (
        <SoftAviationCheckInFlow
          invitadoId={invitadoId}
          initialEstado={rsvpEstado ?? initialEstado}
          initialRestricciones={restriccionesFromDb(restriccionesRaw)}
          spotifyPlaylistUrl={spotifyPlaylistUrl}
          flowMode={flowMode}
          onClose={() => setOpen(false)}
          onRsvpSaved={handleRsvpSaved}
        />
      ) : null}
    </>
  );
}
