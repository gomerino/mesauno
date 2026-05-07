"use client";

import { BoardingPassHeader } from "@/components/BoardingPassHeader";
import type { AviationInvitacionVariant } from "@/components/themes/AviationInvitacionContext";
import type { InviteAviationTicketUi } from "@/lib/aviation-invite-ticket-ui";
import { dressGoldAccent, embarqueGoldCell, getAviationInviteTicketUi } from "@/lib/aviation-invite-ticket-ui";
import { MapPin, Navigation } from "lucide-react";
import type { ReactNode } from "react";

/** Formato visual tipo boarding pass: MAYÚSCULAS (datos siguen viniendo de BD o demo). */
export function boardingPassName(name: string): string {
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

export type BoardingPassProps = {
  variant: AviationInvitacionVariant;
  nombres: string | string[];
  fecha: string;
  hora: string;
  lugar: string;
  codigo: string;
  grupo?: string;
  dressCode?: string;
  /** Contenido celda DESTINO; por defecto `lugar` en mayúsculas con estilo de detalle. */
  destino?: ReactNode;
  /** Texto bajo ITINERARIO (📍); por defecto `lugar`. */
  itinerarioDireccion?: string;
  mapUrl?: string;
  wazeUrl?: string;
  actionSlot?: ReactNode;
  isEventDay?: boolean;
  boardingOrigenIata?: string;
  boardingDestinoIata?: string;
  airlineName?: string;
  tagline?: string;
  logoSrc?: string;
  emblemSrc?: string;
};

/**
 * Pase de abordaje (invitación Soft Aviation): presentación pura, sin datos remotos ni hooks.
 */
export function BoardingPass({
  variant,
  nombres,
  fecha,
  hora,
  codigo,
  grupo,
  lugar,
  dressCode = "Elegante",
  destino,
  itinerarioDireccion,
  mapUrl: mapUrlProp,
  wazeUrl: wazeUrlProp,
  actionSlot,
  isEventDay = false,
  boardingOrigenIata = "",
  boardingDestinoIata = "",
  airlineName = "DREAMS AIRLINES",
  tagline = "together, forever",
  logoSrc = "/dreams-airlines-logo.png",
  emblemSrc,
}: BoardingPassProps) {
  const t = getAviationInviteTicketUi(variant);
  const headerPalette = variant === "jurnex" ? "inviteJurnex" : "invite";

  const mapQuery = (itinerarioDireccion ?? lugar).trim();
  const mapUrl =
    mapUrlProp ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const wazeUrl =
    wazeUrlProp ?? `https://waze.com/ul?q=${encodeURIComponent(mapQuery)}&navigate=yes`;

  const useRouteHeader =
    Boolean(boardingOrigenIata.trim()) && Boolean(boardingDestinoIata.trim());

  const nameParts = typeof nombres === "string" ? [nombres] : nombres;
  const [primaryName, ...secondaryNames] = nameParts;

  const destinoInner =
    destino ??
    (lugar.trim() ? (
      <span
        className={`whitespace-normal break-words text-[8px] font-semibold leading-[1.3] ${t.sectionText} sm:text-[9px]`}
      >
        {boardingPassName(lugar)}
      </span>
    ) : (
      <span className={`text-[9px] font-medium leading-[1.3] ${t.destinoSecondary} sm:text-[10px]`}>
        Por asignar <span aria-hidden>✈️</span>
      </span>
    ));

  const grupoLabel = grupo?.trim() || "—";

  const addressLine = itinerarioDireccion ?? lugar;

  return (
    <section className={`mx-auto flex w-full min-w-0 max-w-full flex-col items-stretch px-0 ${t.sectionText}`}>
      <div
        className={`animate-ticketPrintIn mx-auto w-full min-w-0 max-w-full overflow-hidden rounded-sm border ${t.cardBorder} bg-white shadow-[0_6px_24px_rgba(0,0,0,0.18)]`}
      >
        <BoardingPassHeader
          originCode={useRouteHeader ? boardingOrigenIata : ""}
          destCode={useRouteHeader ? boardingDestinoIata : ""}
          palette={headerPalette}
          routeDisplay={useRouteHeader ? "airports" : "branded"}
          airlineName={airlineName}
          tagline={tagline}
          logoSrc={logoSrc}
          emblemSrc={emblemSrc}
        />

        <div className="px-3 pb-3 pt-3 sm:px-4 sm:pt-4">
          <div>
            <p
              className={`text-left text-[7px] font-semibold uppercase leading-none tracking-[0.22em] ${t.lineUpper} sm:text-[8px] sm:tracking-[0.24em]`}
            >
              Nombre del pasajero / Passenger name
            </p>
            <div className="mb-5 mt-4 space-y-2.5 sm:mt-4">
              {primaryName ? (
                <p
                  className={`break-words text-left font-sans text-[clamp(0.8125rem,3.4vw,0.9375rem)] font-bold uppercase leading-tight tracking-[0.06em] ${t.passenger}`}
                >
                  {boardingPassName(primaryName)}
                </p>
              ) : null}
              {secondaryNames.map((nombre, i) => (
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
            <span className={`font-semibold ${dressGoldAccent(variant)}`}>{dressCode}</span>
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
                {codigo}
              </p>
            </DashCell>
            <DashCell label="Hora" mono nowrap tone={t}>
              <div className={embarqueGoldCell(variant)}>{hora}</div>
            </DashCell>
            <DashCell label="Fecha" value={fecha} mono nowrap tone={t} />
            <DashCell label="DESTINO" labelClassName="tracking-tighter" tone={t}>
              <div className="flex max-h-[4rem] min-h-[2.25rem] w-full items-center justify-center overflow-y-auto px-0.5 py-1.5 text-center">
                {destinoInner}
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
            {addressLine}
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
