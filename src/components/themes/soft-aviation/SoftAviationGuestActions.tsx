"use client";

import { restriccionesFromDb } from "@/lib/restricciones-alimenticias";
import { hasCompletedRsvp, rsvpUiStateFromDb, type RsvpUiState } from "@/lib/rsvp-ui-state";
import { useCallback, useEffect, useState } from "react";
import { SoftAviationCheckInFlow } from "./SoftAviationCheckInFlow";

type DbRsvp = "confirmado" | "declinado" | "pendiente";

type Props = {
  invitadoId: string;
  initialEstado: string | null;
  restriccionesRaw: string | string[] | null | undefined;
  spotifyPlaylistUrl: string | null;
  /** `embedded`: botón en flujo (debajo del hub de pestañas). `fixed`: barra fija al viewport (legacy). */
  footerMode?: "fixed" | "embedded";
  /** Notifica al shell cuando cambia el estado (navegación, etc.). */
  onRsvpEstadoChange?: (estado: string | null) => void;
};

export function SoftAviationGuestActions({
  invitadoId,
  initialEstado,
  restriccionesRaw,
  spotifyPlaylistUrl,
  footerMode = "fixed",
  onRsvpEstadoChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [flowMode, setFlowMode] = useState<"create" | "edit">("create");
  const [rsvpEstado, setRsvpEstado] = useState<string | null>(initialEstado);
  const [cancelLoading, setCancelLoading] = useState(false);
  const embedded = footerMode === "embedded";

  useEffect(() => {
    setRsvpEstado(initialEstado);
  }, [initialEstado]);

  const ui: RsvpUiState = rsvpUiStateFromDb(rsvpEstado);

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

  const cancelAttendance = useCallback(async () => {
    if (!window.confirm("¿Confirmas que ya no podrás asistir? Podrás volver a cambiar la respuesta después.")) {
      return;
    }
    setCancelLoading(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitadoId,
          rsvp_estado: "declinado" as const,
          restricciones_alimenticias: restriccionesFromDb(restriccionesRaw) || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Error");
      setRsvpEstado("declinado");
      notifyParent("declinado");
    } catch {
      window.alert("No se pudo actualizar. Intenta de nuevo.");
    } finally {
      setCancelLoading(false);
    }
  }, [invitadoId, notifyParent, restriccionesRaw]);

  const primaryCtaClass =
    "w-full rounded-full bg-[#D4AF37] py-3 text-center text-sm font-semibold text-[#1A2B48] shadow-sm transition hover:brightness-105 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A2B48]/30 focus-visible:ring-offset-2";

  const secondaryOutlineClass =
    "w-full rounded-full border-2 border-[#1A2B48]/20 bg-white py-2.5 text-center text-sm font-semibold text-[#1A2B48] transition hover:bg-[#1A2B48]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A2B48]/25";

  const ctaBlock = (
    <div className="space-y-3">
      {ui === "pending" && (
        <>
          <p className="text-center text-[13px] leading-snug text-[#1A2B48]/80">
            Confirma tu asistencia para que podamos organizar todo <span aria-hidden>✈️</span>
          </p>
          <button type="button" onClick={openCreate} className={primaryCtaClass}>
            Confirmar asistencia
          </button>
        </>
      )}

      {ui === "confirmed" && (
        <>
          <p className="text-center text-[13px] font-semibold leading-snug text-[#1A2B48]">
            <span aria-hidden>✅</span> Asistencia confirmada
          </p>
          <button type="button" onClick={openEdit} className={primaryCtaClass}>
            Editar asistencia
          </button>
          <button
            type="button"
            onClick={() => void cancelAttendance()}
            disabled={cancelLoading}
            className={`${secondaryOutlineClass} text-[#1A2B48]/75 disabled:opacity-50`}
          >
            {cancelLoading ? "Guardando…" : "Cancelar asistencia"}
          </button>
        </>
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
