"use client";

import { BoardingPassCard } from "@/components/BoardingPassCard";
import { SoftAviationTicket } from "@/components/themes/soft-aviation/SoftAviationTicket";
import { boardingPassQrMapUrlMerged, mergeEventoParaPase } from "@/lib/evento-boarding";
import type { InvitacionThemeId } from "@/lib/invitacion-theme";
import type { Evento, EventoProgramaHito, Invitado } from "@/types/database";
import { useMemo } from "react";

const EMPTY_PROGRAMA: EventoProgramaHito[] = [];

const PREVIEW_INVITADO_ID = "00000000-0000-4000-8000-00000000e701";

type Props = {
  /** Valores actuales del formulario (misma fuente de verdad que al guardar). */
  previewEvento: Evento;
  /** Tema aplicado o el pendiente mientras editás «Estilo». */
  themeId: InvitacionThemeId;
};

/**
 * Vista previa del pase con los datos del viaje: ancla emocional en la pestaña «Datos».
 */
export function EventoDatosBoardingPassPreview({ previewEvento, themeId }: Props) {
  const invitadoPreview: Invitado = useMemo(
    () => ({
      id: PREVIEW_INVITADO_ID,
      nombre_pasajero: "Sofía (así verá su nombre)",
      invitado_acompanantes: [],
      email: null,
      telefono: null,
      restricciones_alimenticias: null,
      rsvp_estado: "pendiente",
      codigo_vuelo: null,
      asiento: previewEvento.asiento_default?.trim() || null,
      puerta: null,
      hora_embarque: null,
      destino: null,
      nombre_evento: null,
      fecha_evento: null,
      motivo_viaje: null,
      evento_id: previewEvento.id,
      token_acceso: "panel-preview",
      qr_code_token: "panel-preview",
    }),
    [previewEvento.id, previewEvento.asiento_default]
  );

  const merged = useMemo(
    () => mergeEventoParaPase(invitadoPreview, previewEvento),
    [invitadoPreview, previewEvento]
  );
  const mapUrl = useMemo(
    () => boardingPassQrMapUrlMerged(invitadoPreview, previewEvento),
    [invitadoPreview, previewEvento]
  );

  return (
    <div className="w-full min-w-0 max-w-[28rem] box-border rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-200/80">Tu boarding pass</p>
      <p className="mt-1 text-xs leading-relaxed text-white/60">
        Completá los bloques a la izquierda: en el pase final cada persona verá su nombre, asiento y los datos de vuelo
        y lugar que definas.
      </p>
      <div className="mt-3 w-full min-w-0">
        {themeId === "soft-aviation" ? (
          <div className="w-full min-w-0 rounded-2xl bg-invite-sand p-2 sm:px-3 sm:py-3">
            <div className="mx-auto w-full min-w-0 max-w-[20.5rem]">
              <SoftAviationTicket
                invitado={invitadoPreview}
                evento={previewEvento}
                merged={merged}
                mapUrl={mapUrl}
                programaHitos={EMPTY_PROGRAMA}
              />
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full min-w-0 max-w-[20.5rem]">
            <BoardingPassCard invitado={invitadoPreview} evento={previewEvento} qrValue={mapUrl} />
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-[10px] text-white/40">
        Tema: {themeId === "soft-aviation" ? "Premium Aviation" : "Clásico"} · cámbialo en la pestaña Invitación, sección
        &quot;Estilo de invitación&quot;
      </p>
    </div>
  );
}
