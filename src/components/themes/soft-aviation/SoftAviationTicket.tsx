"use client";

import { BoardingPass } from "@/components/invitacion/BoardingPass";
import { useAviationInvitacionVariant } from "@/components/themes/AviationInvitacionContext";
import type { MergedEventoParaPase } from "@/lib/evento-boarding";
import { addressForMapFromPass } from "@/lib/evento-boarding";
import { formatFechaDDMMMYY } from "@/lib/format-fecha-evento";
import { getAviationInviteTicketUi } from "@/lib/aviation-invite-ticket-ui";
import { guestSeatLines, guestSeatRaw, inferGuestGrupo } from "@/lib/guest-boarding-meta";
import { nombresAcompanantes } from "@/lib/invitado-acompanantes";
import type { Evento, EventoProgramaHito, Invitado } from "@/types/database";
import type { ReactNode } from "react";

function formatHoraEmbarqueCell(hora: string | null | undefined) {
  const raw = String(hora ?? "")
    .trim()
    .slice(0, 8);
  if (!raw) return "17:30";
  const m = raw.match(/^(\d{1,2}):(\d{2})/);
  if (m) {
    const hh = Math.min(23, Math.max(0, parseInt(m[1]!, 10)));
    const mm = Math.min(59, Math.max(0, parseInt(m[2]!, 10)));
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }
  return raw || "17:30";
}

function horaInicioDesdePrograma(hitos: EventoProgramaHito[]): string | null {
  if (!hitos.length) return null;
  const sorted = [...hitos].sort((a, b) => {
    const o = (a.orden ?? 0) - (b.orden ?? 0);
    if (o !== 0) return o;
    return (a.hora ?? "").localeCompare(b.hora ?? "");
  });
  const h = sorted[0]?.hora;
  return h ? h.slice(0, 5) : null;
}

type Props = {
  invitado: Invitado;
  evento: Evento | null;
  merged: MergedEventoParaPase;
  mapUrl: string;
  programaHitos: EventoProgramaHito[];
  dressCodeLabel?: string;
  isEventDay?: boolean;
  actionSlot?: ReactNode;
};

export function SoftAviationTicket({
  invitado,
  evento,
  merged,
  mapUrl,
  programaHitos,
  dressCodeLabel = "Elegante",
  isEventDay = false,
  actionSlot,
}: Props) {
  const variant = useAviationInvitacionVariant();
  const t = getAviationInviteTicketUi(variant);

  const addressForNav = addressForMapFromPass(invitado, evento);
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(addressForNav)}&navigate=yes`;
  const dressEffective = merged.dress_code?.trim() || dressCodeLabel;

  const vuelo = merged.codigo_vuelo.trim() || "DM7726";
  const embarquePrograma = horaInicioDesdePrograma(programaHitos);
  const embarque = formatHoraEmbarqueCell(embarquePrograma ?? merged.hora_embarque ?? "");
  const fecha = formatFechaDDMMMYY(merged.fecha_evento, "— — —");
  const seatLines = guestSeatLines(invitado, evento);
  const destinoDetalle =
    seatLines.length > 0 ? (
      <span
        className={`whitespace-normal break-words text-[8px] font-semibold leading-[1.3] ${t.sectionText} sm:text-[9px]`}
      >
        {seatLines.map((line, i) => (
          <span key={`${i}-${line}`}>
            {i > 0 ? <br /> : null}
            {line}
          </span>
        ))}
      </span>
    ) : (
      <span className={`text-[9px] font-medium leading-[1.3] ${t.destinoSecondary} sm:text-[10px]`}>
        Por asignar <span aria-hidden>✈️</span>
      </span>
    );

  const acompanantes = nombresAcompanantes(invitado);
  const grupoLabel =
    evento?.grupo_embarque_default?.trim() ||
    (() => {
      const raw = guestSeatRaw(invitado, evento);
      return inferGuestGrupo(raw);
    })();

  const useRouteHeader = Boolean(
    (evento?.boarding_origen_iata?.trim() || "").length > 0 && (evento?.boarding_destino_iata?.trim() || "").length > 0
  );
  const headerLinea = evento?.boarding_linea_aerea?.trim() || "DREAMS AIRLINES";
  const headerTag = evento?.boarding_tagline?.trim() || "together, forever";
  const headerLogo = evento?.boarding_logo_url?.trim() || "/dreams-airlines-logo.png";
  const headerEmblem = evento?.boarding_emblema_url?.trim() || undefined;

  return (
    <BoardingPass
      variant={variant}
      nombres={[invitado.nombre_pasajero, ...acompanantes]}
      fecha={fecha}
      hora={embarque}
      lugar={addressForNav}
      codigo={vuelo}
      grupo={grupoLabel}
      dressCode={dressEffective}
      destino={destinoDetalle}
      itinerarioDireccion={addressForNav}
      mapUrl={mapUrl}
      wazeUrl={wazeUrl}
      actionSlot={actionSlot}
      isEventDay={isEventDay}
      boardingOrigenIata={useRouteHeader ? (evento?.boarding_origen_iata ?? "") : ""}
      boardingDestinoIata={useRouteHeader ? (evento?.boarding_destino_iata ?? "") : ""}
      airlineName={headerLinea}
      tagline={headerTag}
      logoSrc={headerLogo}
      emblemSrc={headerEmblem}
    />
  );
}
