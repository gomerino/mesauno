import type { ReactNode } from "react";
import type { Invitado, Evento } from "@/types/database";
import { mergeEventoParaPase, resolveDestinoParaMapa } from "@/lib/evento-boarding";
import { BoardingPassHeader } from "@/components/BoardingPassHeader";
import { BoardingPassQR } from "@/components/BoardingPassQR";
import { EventPlaylistSection } from "@/components/EventPlaylistSection";
import type { EventPlaylistUrls } from "@/lib/event-playlist-env";
import { hasAnyPlaylist } from "@/lib/event-playlist-env";
import { isMapsQrPayload } from "@/lib/event-maps";
import { nombresAcompanantes } from "@/lib/invitado-acompanantes";

const NAVY = "#001d66";

/** Ancho típico de boarding pass térmico / móvil (~82 mm a escala UI). */
const BP_WIDTH = "min(100vw - 1.5rem, 20rem)";

const MESES_CORTO = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
] as const;

/** Formato invitación: 04 ABR 27 */
function formatFechaDDMMMYY(iso: string | null, fallback: string) {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const mon = MESES_CORTO[d.getUTCMonth()] ?? "---";
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${day} ${mon} ${yy}`;
}

function isHttpUrl(s: string): boolean {
  return s.startsWith("https://") || s.startsWith("http://");
}

function airportCodeFromLine(line: string, fallback: string): string {
  const w = line.trim().split(/\s+/)[0] ?? "";
  const letters = w.replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (letters.length >= 3) return letters.slice(0, 3);
  return fallback.slice(0, 3).toUpperCase();
}

type Props = {
  invitado: Invitado;
  /** Configuración global del evento; null usa solo datos legacy del invitado. */
  evento: Evento | null;
  qrValue: string;
  /** Spotify, Apple Music u otro enlace (ver `resolveEventPlaylistEnv`). */
  playlists?: EventPlaylistUrls | null;
};

function DashCell({
  label,
  value,
  mono,
  children,
  nowrap,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: ReactNode;
  /** Una sola línea (asiento, fecha, vuelo). */
  nowrap?: boolean;
}) {
  const v = value && value.length > 0 ? value : "—";
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5 border-r border-dotted border-gray-300 px-0.5 py-1.5 text-center last:border-r-0 sm:px-1">
      <p className="w-full shrink-0 text-[7px] font-semibold uppercase leading-none tracking-wide text-gray-500">
        {label}
      </p>
      {children ?? (
        <p
          className={`w-full text-[10px] font-bold leading-none text-gray-900 sm:text-[11px] ${mono ? "font-mono tracking-tight" : ""} ${nowrap ? "whitespace-nowrap" : "break-words"}`}
        >
          {v}
        </p>
      )}
    </div>
  );
}

export function BoardingPassCard({ invitado, evento, qrValue, playlists = null }: Props) {
  const ev = mergeEventoParaPase(invitado, evento);
  const vuelo = ev.codigo_vuelo.trim() || "DM7726";
  const embarque = ev.hora_embarque.trim() || "17:30";
  const fecha = formatFechaDDMMMYY(ev.fecha_evento, "20 FEB 27");
  const destinoLinea = resolveDestinoParaMapa(ev.destino);
  const destCode = airportCodeFromLine(destinoLinea, "LOV");
  const originCode = process.env.NEXT_PUBLIC_BOARDING_ORIGIN_CODE?.trim() || "SCL";
  const asiento = ev.asiento.trim() || "—";
  const acompanantes = nombresAcompanantes(invitado);

  return (
    <div
      className="mx-auto overflow-hidden rounded-sm border border-gray-300 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.18)]"
      style={{ width: BP_WIDTH, maxWidth: "20rem" }}
    >
      <BoardingPassHeader originCode={originCode} destCode={destCode} />

      {/* Perforación tipo talón de aerolínea */}
      <div className="border-t-2 border-dashed border-gray-300 bg-[linear-gradient(to_bottom,#ebebeb_0%,#fafafa_100%)]" />

      <div className="px-3 py-2.5 sm:px-4 sm:py-3">
        <p className="break-words text-center text-[10px] font-medium leading-snug text-gray-800 sm:text-[11px]">
          {ev.lugar_evento_linea}
        </p>

        {/* Pasajero */}
        <div className="mt-3 border-t border-dashed border-gray-200 pt-2.5">
          <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            Nombre del pasajero / Passenger name
          </p>
          <p className="mt-0.5 break-words font-display text-base font-bold uppercase leading-tight tracking-wide text-gray-900 sm:text-lg">
            {invitado.nombre_pasajero}
          </p>
          {acompanantes.map((nombre, i) => (
            <p
              key={`${i}-${nombre}`}
              className="mt-1 break-words font-display text-sm font-semibold uppercase leading-snug tracking-wide text-gray-800 sm:text-base"
            >
              {nombre}
            </p>
          ))}
          <p className="mt-1 text-[9px] text-gray-600">Clase: Primera · Dress code elegante</p>
        </div>

        {/* Vuelo · Embarque · Fecha · Asiento — columnas repartidas, valores en una línea */}
        <div className="mt-3 border-t border-gray-200 pt-2" aria-label="Detalles de vuelo">
          <div className="grid w-full border-t border-gray-200 [grid-template-columns:minmax(0,0.95fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.95fr)]">
            <DashCell label="Vuelo" value={vuelo} mono nowrap />
            <DashCell label="Embarque" mono nowrap>
              <div
                className="w-full whitespace-nowrap px-1 py-0.5 text-center font-mono text-[10px] font-bold leading-none text-white sm:text-[11px]"
                style={{ backgroundColor: NAVY }}
              >
                {embarque}
              </div>
            </DashCell>
            <DashCell label="Fecha" value={fecha} mono nowrap />
            <DashCell label="Asiento" value={asiento} mono nowrap />
          </div>
        </div>

        {/* QR — clicable si el valor es una URL (mismo destino que al escanear) */}
        <div className="mt-3 flex justify-center border-t border-dashed border-gray-200 pt-3">
          <div className="text-center">
            {isHttpUrl(qrValue) ? (
              <a
                href={qrValue}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-block cursor-pointer rounded-xl outline-none ring-offset-2 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#001d66]"
                aria-label={
                  isMapsQrPayload(qrValue)
                    ? "Abrir cómo llegar en el mapa"
                    : "Abrir enlace del código QR"
                }
              >
                <BoardingPassQR value={qrValue} size={72} />
                <p className="mt-1 font-mono text-[8px] uppercase tracking-wider text-[#001d66] underline decoration-[#001d66]/40 underline-offset-2 group-hover:text-[#002a8c]">
                  {isMapsQrPayload(qrValue) ? "Tocar · Cómo llegar" : "Tocar para abrir"}
                </p>
              </a>
            ) : (
              <>
                <BoardingPassQR value={qrValue} size={72} />
                <p className="mt-1 font-mono text-[8px] uppercase tracking-wider text-gray-500">
                  {isMapsQrPayload(qrValue) ? "Escanear · Cómo llegar" : "Scan / Embarque digital"}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {playlists && hasAnyPlaylist(playlists) && <EventPlaylistSection {...playlists} />}

      <footer className="border-t border-gray-100 bg-gray-50/80 px-3 py-2.5 text-center sm:px-4">
        <p className="break-words text-[10px] font-medium leading-relaxed text-gray-800 sm:text-[11px]">
          Operado por Dreams Airlines
          {ev.footerNovios ? ` — ${ev.footerNovios}` : ""}. ¡Los esperamos en el embarque!
        </p>
      </footer>
    </div>
  );
}
