"use client";

import { BoardingPassHeader } from "@/components/BoardingPassHeader";
import { useAviationInvitacionVariant } from "@/components/themes/AviationInvitacionContext";
import type { MergedEventoParaPase } from "@/lib/evento-boarding";
import { addressForMapFromPass } from "@/lib/evento-boarding";
import { formatFechaDDMMMYY } from "@/lib/format-fecha-evento";
import {
  dressGoldAccent,
  embarqueGoldCell,
  getAviationInviteTicketUi,
} from "@/lib/aviation-invite-ticket-ui";
import { guestSeatLines, guestSeatRaw, inferGuestGrupo } from "@/lib/guest-boarding-meta";
import { nombresAcompanantes } from "@/lib/invitado-acompanantes";
import type { InviteAviationTicketUi } from "@/lib/aviation-invite-ticket-ui";
import type { Evento, EventoProgramaHito, Invitado } from "@/types/database";
import { MapPin, Navigation } from "lucide-react";
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

/** Formato visual tipo boarding pass: MAYÚSCULAS (datos siguen viniendo de BD). */
function boardingPassName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toUpperCase();
}

function DashCell({
  label,
  value,
  mono,
  children,
  nowrap,
  labelClassName,
  tone,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: ReactNode;
  nowrap?: boolean;
  labelClassName?: string;
  tone: InviteAviationTicketUi;
}) {
  const val = value && value.length > 0 ? value : "—";
  const valueClass = `w-full text-[10px] font-bold leading-none ${tone.valueMain} sm:text-[11px] ${
    mono ? "font-mono tracking-tight" : ""
  } ${nowrap ? "whitespace-nowrap" : "break-words"}`;
  return (
    <div
      className={`flex h-full min-w-0 flex-col items-stretch border-r border-dotted ${tone.dashCellBorder} px-0.5 py-1.5 text-center last:border-r-0 sm:px-1`}
    >
      <p
        className={`w-full shrink-0 text-[7px] font-semibold uppercase leading-none tracking-wide ${tone.labelMuted} ${labelClassName ?? ""}`}
      >
        {label}
      </p>
      <div className="flex min-h-[1.625rem] flex-1 flex-col items-center justify-center sm:min-h-[1.75rem]">
        {children ?? (
          <p className={`flex w-full items-center justify-center ${valueClass}`}>
            {val}
          </p>
        )}
      </div>
    </div>
  );
}

type Props = {
  invitado: Invitado;
  evento: Evento | null;
  merged: MergedEventoParaPase;
  mapUrl: string;
  programaHitos: EventoProgramaHito[];
  /** Etiqueta de dress code (p. ej. onboarding). Por defecto "Elegante". */
  dressCodeLabel?: string;
  /** Si true, se omite la línea de cierre "te esperamos a bordo" (gran día). */
  isEventDay?: boolean;
  /** Acción contextual dentro del pase (p. ej. confirmar / editar asistencia). */
  actionSlot?: ReactNode;
};

/**
 * Boarding pass: una sola tarjeta — cabecera, grid, itinerario integrado (solo líneas punteadas).
 */
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
  const headerPalette = variant === "jurnex" ? "inviteJurnex" : "invite";

  const addressForNav = addressForMapFromPass(invitado, evento);
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(addressForNav)}&navigate=yes`;
  const dressEffective = merged.dress_code?.trim() || dressCodeLabel;

  const vuelo = merged.codigo_vuelo.trim() || "DM7726";
  const embarquePrograma = horaInicioDesdePrograma(programaHitos);
  const embarque = formatHoraEmbarqueCell(embarquePrograma ?? merged.hora_embarque ?? "");
  const fecha = formatFechaDDMMMYY(merged.fecha_evento, "— — —");
  const seatRaw = guestSeatRaw(invitado, evento);
  const seatLines = guestSeatLines(invitado, evento);
  /** En el detalle del pase, «DESTINO» = asiento (defecto evento o fila del invitado). */
  const destinoDetalle = seatLines.length > 0 ? (
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
    <section className={`mx-auto flex w-full min-w-0 max-w-full flex-col items-stretch px-0 ${t.sectionText}`}>
      <div
        className={`animate-ticketPrintIn mx-auto w-full min-w-0 max-w-full overflow-hidden rounded-sm border ${t.cardBorder} bg-white shadow-[0_6px_24px_rgba(0,0,0,0.18)]`}
      >
        <BoardingPassHeader
          originCode={useRouteHeader ? (evento?.boarding_origen_iata ?? "") : ""}
          destCode={useRouteHeader ? (evento?.boarding_destino_iata ?? "") : ""}
          palette={headerPalette}
          routeDisplay={useRouteHeader ? "airports" : "branded"}
          airlineName={headerLinea}
          tagline={headerTag}
          logoSrc={headerLogo}
          emblemSrc={headerEmblem}
        />

        <div className="px-3 pb-3 pt-3 sm:px-4 sm:pt-4">
          <div>
            <p
              className={`text-left text-[7px] font-semibold uppercase leading-none tracking-[0.22em] ${t.lineUpper} sm:text-[8px] sm:tracking-[0.24em]`}
            >
              Nombre del pasajero / Passenger name
            </p>
            <div className="mb-5 mt-4 space-y-2.5 sm:mt-4">
              <p
                className={`break-words text-left font-sans text-[clamp(0.8125rem,3.4vw,0.9375rem)] font-bold uppercase leading-tight tracking-[0.06em] ${t.passenger}`}
              >
                {boardingPassName(invitado.nombre_pasajero)}
              </p>
              {acompanantes.map((nombre, i) => (
                <p
                  key={`${i}-${nombre}`}
                  className={`break-words text-left font-sans text-[clamp(0.75rem,3.1vw,0.875rem)] font-bold uppercase leading-tight tracking-[0.05em] ${t.passengerSecondary}`}
                >
                  {boardingPassName(nombre)}
                </p>
              ))}
            </div>
          </div>

          <p className={`mb-1 text-center text-[10px] font-medium leading-snug ${t.dress} sm:mb-2 sm:text-[11px]`}>
            <span className={t.dressCodeLabel}>Dress code:</span>{" "}
            <span className={`font-semibold ${dressGoldAccent(variant)}`}>{dressEffective}</span>
          </p>
        </div>

        {actionSlot ? (
          <div className={`border-t border-dashed ${t.dashDashed} bg-slate-50/80 px-3 py-3 sm:px-4`}>
            {actionSlot}
          </div>
        ) : null}

        <div
          className={`border-t border-dashed ${t.dashDashed} px-3 pb-1 pt-5 sm:px-4 sm:pt-6`}
          aria-label="Detalle del pase"
        >
          <div className="grid w-full items-stretch [grid-template-columns:minmax(0,0.62fr)_minmax(2.65rem,0.88fr)_minmax(0,0.88fr)_minmax(0,1.05fr)_minmax(0,0.72fr)]">
            <DashCell label="Código" nowrap tone={t}>
              <p className={`w-full whitespace-nowrap px-0.5 text-center font-mono text-[7px] font-medium leading-none ${t.codeMono} sm:text-[8px]`}>
                {vuelo}
              </p>
            </DashCell>
            <DashCell label="Hora" mono nowrap tone={t}>
              <div className={embarqueGoldCell(variant)}>{embarque}</div>
            </DashCell>
            <DashCell label="Fecha" value={fecha} mono nowrap tone={t} />
            <DashCell label="DESTINO" labelClassName="tracking-tighter" tone={t}>
              <div className="flex max-h-[4rem] min-h-[2.25rem] w-full items-center justify-center overflow-y-auto px-0.5 py-1.5 text-center">
                {destinoDetalle}
              </div>
            </DashCell>
            <DashCell label="GRUPO" nowrap tone={t}>
              <p className={`w-full break-words text-[8px] font-semibold leading-tight ${t.grupo} sm:text-[9px]`}>
                {grupoLabel}
              </p>
            </DashCell>
          </div>
        </div>

        <div className={`border-t border-dashed ${t.dashDashed} px-3 pb-4 pt-5 sm:px-4 sm:pt-6`}>
          <p className={`text-center text-[8px] font-semibold uppercase tracking-[0.28em] ${t.itinTitle}`}>ITINERARIO</p>
          <p className={`mt-2 break-words text-center text-[12px] font-semibold leading-snug ${t.itinAddress} sm:text-[13px]`}>
            <span aria-hidden className="mr-0.5">
              📍
            </span>
            {addressForNav}
          </p>
          <p className={`mt-2 text-center text-[10px] ${t.itinHint}`}>Llega 15 min antes</p>

          <div className="mt-3 flex flex-row flex-wrap items-center justify-center gap-2">
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={t.inlineMapBtn}>
              <MapPin className={`h-3.5 w-3.5 shrink-0 stroke-[2] ${t.mapIcon}`} aria-hidden />
              Cómo llegar
            </a>
            <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className={t.inlineMapBtn}>
              <Navigation className={`h-3.5 w-3.5 shrink-0 ${t.mapIcon}`} strokeWidth={2} aria-hidden />
              Waze
            </a>
          </div>
        </div>

        {!isEventDay ? (
          <div className={`border-t border-dashed ${t.dashDashed} px-3 py-3 text-center sm:px-4`}>
            <p className={`text-[9px] font-medium leading-relaxed ${t.itinCierre} sm:text-[10px]`}>
              Todo listo, te esperamos a bordo
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
