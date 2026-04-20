import { BoardingPassHeader } from "@/components/BoardingPassHeader";
import type { MergedEventoParaPase } from "@/lib/evento-boarding";
import { resolveDestinoParaMapa } from "@/lib/evento-boarding";
import { formatFechaDDMMMYY } from "@/lib/format-fecha-evento";
import { guestSeatLines, inferGuestGrupo } from "@/lib/guest-boarding-meta";
import { nombresAcompanantes } from "@/lib/invitado-acompanantes";
import type { Evento, EventoProgramaHito, Invitado } from "@/types/database";
import { MapPin, Navigation } from "lucide-react";
import type { ReactNode } from "react";

const BP_WIDTH = "min(100vw - 1.5rem, 20rem)";

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
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: ReactNode;
  nowrap?: boolean;
  labelClassName?: string;
}) {
  const v = value && value.length > 0 ? value : "—";
  const valueClass = `w-full text-[10px] font-bold leading-none text-invite-navy sm:text-[11px] ${mono ? "font-mono tracking-tight" : ""} ${nowrap ? "whitespace-nowrap" : "break-words"}`;
  return (
    <div className="flex h-full min-w-0 flex-col items-stretch border-r border-dotted border-invite-navy/25 px-0.5 py-1.5 text-center last:border-r-0 sm:px-1">
      <p
        className={`w-full shrink-0 text-[7px] font-semibold uppercase leading-none tracking-wide text-invite-navy/50 ${labelClassName ?? ""}`}
      >
        {label}
      </p>
      <div className="flex min-h-[1.625rem] flex-1 flex-col items-center justify-center sm:min-h-[1.75rem]">
        {children ?? (
          <p className={`flex w-full items-center justify-center ${valueClass}`}>
            {v}
          </p>
        )}
      </div>
    </div>
  );
}

const inlineMapBtnClass =
  "inline-flex min-h-[34px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-invite-navy/28 bg-white/90 px-2.5 py-1.5 text-[10px] font-semibold text-invite-navy shadow-none transition-all duration-200 ease-out hover:bg-invite-sand/50 hover:opacity-90 active:scale-[0.97] active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-invite-navy/35";

type Props = {
  invitado: Invitado;
  evento: Evento | null;
  merged: MergedEventoParaPase;
  mapUrl: string;
  programaHitos: EventoProgramaHito[];
  /** Etiqueta de dress code (p. ej. onboarding). Por defecto "Elegante". */
  dressCodeLabel?: string;
  /** Si true, se omite la línea de cierre “te esperamos a bordo” (gran día). */
  isEventDay?: boolean;
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
}: Props) {
  const address = resolveDestinoParaMapa(merged.destino);
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;

  const vuelo = merged.codigo_vuelo.trim() || "DM7726";
  const embarquePrograma = horaInicioDesdePrograma(programaHitos);
  const embarque = formatHoraEmbarqueCell(embarquePrograma ?? merged.hora_embarque ?? "");
  const fecha = formatFechaDDMMMYY(merged.fecha_evento, "— — —");
  const seatLines = guestSeatLines(invitado, evento);
  const seatRaw = seatLines.join("\n");
  const grupo = inferGuestGrupo(seatRaw);
  const destinoDisplay =
    seatLines.length > 0 ? (
      <span className="whitespace-normal break-words text-[9px] font-semibold leading-[1.3] text-invite-navy sm:text-[10px]">
        {seatLines.map((line, i) => (
          <span key={`${i}-${line}`}>
            {i > 0 ? <br /> : null}
            {line}
          </span>
        ))}
      </span>
    ) : (
      <span className="text-[9px] font-medium leading-[1.3] text-invite-navy/65 sm:text-[10px]">
        Por asignar <span aria-hidden>✈️</span>
      </span>
    );

  const acompanantes = nombresAcompanantes(invitado);
  const lugarNombre = merged.lugar_evento_linea.trim();
  const showAddressLine = address.trim() && address.trim() !== lugarNombre;
  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center px-0 text-invite-navy">
      <div
        className="animate-ticketPrintIn mx-auto w-full overflow-hidden rounded-sm border border-invite-navy/20 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.18)]"
        style={{ maxWidth: "20rem", width: BP_WIDTH }}
      >
        {/* Marca aerolínea */}
        <BoardingPassHeader
          originCode="SCL"
          destCode="DAY"
          palette="invite"
          routeDisplay="branded"
          airlineName="DREAMS AIRLINES"
          tagline="Together, forever"
        />

        {/* Zona 1 — contexto + pasajeros (datos dinámicos desde invitado / acompañantes) */}
        <div className="px-3 pb-3 pt-3 sm:px-4 sm:pt-4">
          <div>
            <p className="text-left text-[7px] font-semibold uppercase leading-none tracking-[0.22em] text-invite-navy/50 sm:text-[8px] sm:tracking-[0.24em]">
              Nombre del pasajero / Passenger name
            </p>
            <div className="mb-5 mt-4 space-y-2.5 sm:mt-4">
              <p className="break-words text-left font-sans text-[clamp(0.8125rem,3.4vw,0.9375rem)] font-bold uppercase leading-tight tracking-[0.06em] text-invite-navy">
                {boardingPassName(invitado.nombre_pasajero)}
              </p>
              {acompanantes.map((nombre, i) => (
                <p
                  key={`${i}-${nombre}`}
                  className="break-words text-left font-sans text-[clamp(0.75rem,3.1vw,0.875rem)] font-bold uppercase leading-tight tracking-[0.05em] text-invite-navy/92"
                >
                  {boardingPassName(nombre)}
                </p>
              ))}
            </div>
          </div>

          <p className="mb-1 text-center text-[10px] font-medium leading-snug text-invite-navy/70 sm:mb-2 sm:text-[11px]">
            <span className="text-invite-navy/55">Dress code:</span>{" "}
            <span className="font-semibold text-invite-gold">{dressCodeLabel}</span>
          </p>
        </div>

        {/* Zona 2 — grid (solo separación punteada) */}
        <div className="border-t border-dashed border-invite-navy/22 px-3 pb-1 pt-5 sm:px-4 sm:pt-6" aria-label="Detalle del pase">
          <div className="grid w-full items-stretch [grid-template-columns:minmax(0,0.62fr)_minmax(2.65rem,0.88fr)_minmax(0,0.88fr)_minmax(0,1.05fr)_minmax(0,0.72fr)]">
            <DashCell label="Código" nowrap>
              <p className="w-full whitespace-nowrap px-0.5 text-center font-mono text-[7px] font-medium leading-none text-invite-navy/40 sm:text-[8px]">
                {vuelo}
              </p>
            </DashCell>
            <DashCell label="Hora" mono nowrap>
              <div className="flex h-full w-full min-w-0 items-center justify-center bg-invite-gold px-0.5 py-1 text-center font-mono text-[10px] font-bold leading-none text-invite-navy sm:px-1 sm:text-[11px]">
                {embarque}
              </div>
            </DashCell>
            <DashCell label="Fecha" value={fecha} mono nowrap />
            <DashCell label="DESTINO" labelClassName="tracking-tighter">
              <div className="flex max-h-[4rem] min-h-[2.25rem] w-full items-center justify-center overflow-y-auto px-0.5 py-1.5 text-center">
                {destinoDisplay}
              </div>
            </DashCell>
            <DashCell label="GRUPO" nowrap>
              <p className="w-full break-words text-[8px] font-semibold leading-tight text-invite-navy/75 sm:text-[9px]">{grupo}</p>
            </DashCell>
          </div>
        </div>

        {/* Zona 3 — itinerario dentro del ticket */}
        <div className="border-t border-dashed border-invite-navy/22 px-3 pb-4 pt-5 sm:px-4 sm:pt-6">
          <p className="text-center text-[8px] font-semibold uppercase tracking-[0.28em] text-invite-navy/45">ITINERARIO</p>
          <p className="mt-2 break-words text-center text-[12px] font-semibold leading-snug text-invite-navy sm:text-[13px]">
            <span aria-hidden className="mr-0.5">
              📍
            </span>
            {lugarNombre}
            {showAddressLine ? (
              <>
                <span className="text-invite-navy/35"> · </span>
                <span className="font-medium text-invite-navy/80">{address}</span>
              </>
            ) : null}
          </p>
          <p className="mt-2 text-center text-[10px] text-invite-navy/50">Llega 15 min antes</p>

          <div className="mt-3 flex flex-row flex-wrap items-center justify-center gap-2">
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={inlineMapBtnClass}>
              <MapPin className="h-3.5 w-3.5 shrink-0 stroke-[2] text-invite-navy/80" aria-hidden />
              Cómo llegar
            </a>
            <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className={inlineMapBtnClass}>
              <Navigation className="h-3.5 w-3.5 shrink-0 text-invite-navy/80" strokeWidth={2} aria-hidden />
              Waze
            </a>
          </div>
        </div>

        {!isEventDay ? (
          <div className="border-t border-dashed border-invite-navy/22 px-3 py-3 text-center sm:px-4">
            <p className="text-[9px] font-medium leading-relaxed text-invite-navy/70 sm:text-[10px]">
              Todo listo, te esperamos a bordo
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
