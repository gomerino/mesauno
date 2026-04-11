"use client";

import { restriccionesFromDb } from "@/lib/restricciones-alimenticias";
import { useCallback, useEffect, useState } from "react";
import { SoftAviationCheckInFlow } from "./SoftAviationCheckInFlow";

type Props = {
  invitadoId: string;
  initialEstado: string | null;
  restriccionesRaw: string | string[] | null | undefined;
  spotifyPlaylistUrl: string | null;
  /** `embedded`: botón en flujo (debajo del hub de pestañas). `fixed`: barra fija al viewport (legacy). */
  footerMode?: "fixed" | "embedded";
};

export function SoftAviationGuestActions({
  invitadoId,
  initialEstado,
  restriccionesRaw,
  spotifyPlaylistUrl,
  footerMode = "fixed",
}: Props) {
  const [open, setOpen] = useState(false);
  const [rsvpEstado, setRsvpEstado] = useState<string | null>(initialEstado);
  const embedded = footerMode === "embedded";

  useEffect(() => {
    setRsvpEstado(initialEstado);
  }, [initialEstado]);

  const handleRsvpSaved = useCallback((estado: "confirmado" | "declinado" | "pendiente") => {
    setRsvpEstado(estado);
  }, []);

  const esConfirmado = rsvpEstado === "confirmado";

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="w-full rounded-full bg-[#D4AF37] py-3 text-center text-sm font-semibold text-[#1A2B48] shadow-sm transition hover:brightness-105 active:scale-[0.99]"
    >
      Confirmar asistencia
    </button>
  );

  const ctaBlock = (
    <div className="space-y-2">
      {esConfirmado ? (
        <p className="text-center text-[13px] font-semibold leading-snug text-[#1A2B48]">
          <span aria-hidden>✅</span> Asistencia confirmada
        </p>
      ) : (
        <p className="text-center text-[13px] leading-snug text-[#1A2B48]/80">
          Confirma tu viaje con nosotros <span aria-hidden>✈️</span>
        </p>
      )}
      {trigger}
    </div>
  );

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
          onClose={() => setOpen(false)}
          onRsvpSaved={handleRsvpSaved}
        />
      ) : null}
    </>
  );
}
