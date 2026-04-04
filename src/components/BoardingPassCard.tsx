import type { ReactNode } from "react";
import type { Invitado, Pareja } from "@/types/database";
import { mergeEventoParaPase, resolveDestinoParaMapa } from "@/lib/pareja-evento";
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

function formatFechaDMY(iso: string | null, fallback: string) {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}.${month}.${year}`;
}

function airportCodeFromLine(line: string, fallback: string): string {
  const w = line.trim().split(/\s+/)[0] ?? "";
  const letters = w.replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (letters.length >= 3) return letters.slice(0, 3);
  return fallback.slice(0, 3).toUpperCase();
}

type Props = {
  invitado: Invitado;
  /** Configuración global (novios + evento); null usa solo datos legacy del invitado. */
  pareja: Pareja | null;
  qrValue: string;
  /** Spotify, Apple Music u otro enlace (ver `resolveEventPlaylistEnv`). */
  playlists?: EventPlaylistUrls | null;
};

function DashCell({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: ReactNode;
}) {
  const v = value && value.length > 0 ? value : "—";
  return (
    <div className="flex min-w-0 flex-col border-r border-dotted border-gray-300 px-0.5 py-1.5 text-center last:border-r-0 sm:px-1">
      <p className="text-[7px] font-semibold uppercase leading-tight tracking-wide text-gray-500">{label}</p>
      {children ?? (
        <p
          className={`mt-0.5 break-words text-[10px] font-bold leading-snug text-gray-900 sm:text-[11px] ${mono ? "font-mono tracking-tight" : ""}`}
        >
          {v}
        </p>
      )}
    </div>
  );
}

export function BoardingPassCard({ invitado, pareja, qrValue, playlists = null }: Props) {
  const ev = mergeEventoParaPase(invitado, pareja);
  const vuelo = ev.codigo_vuelo.trim() || "DM7726";
  const embarque = ev.hora_embarque.trim() || "17:30";
  const fecha = formatFechaDMY(ev.fecha_evento, "20.02.2027");
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

        {/* Vuelo · Embarque · Fecha (más ancha) · Asiento */}
        <div className="mt-3 border-t border-gray-200 pt-2" aria-label="Detalles de vuelo">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2.75fr)_minmax(0,1fr)] border-t border-gray-200">
            <DashCell label="Vuelo" value={vuelo} mono />
            <DashCell label="Embarque" mono>
              <div
                className="mx-auto mt-1 inline-block min-w-[2.75rem] px-1.5 py-0.5 text-center font-mono text-[10px] font-bold text-white sm:text-[11px]"
                style={{ backgroundColor: NAVY }}
              >
                {embarque}
              </div>
            </DashCell>
            <div className="flex min-w-0 flex-col border-r border-dotted border-gray-300 px-1 py-1.5 text-center sm:px-1.5">
              <p className="text-[7px] font-semibold uppercase leading-tight tracking-wide text-gray-500">
                Fecha
              </p>
              <p className="mt-1 break-words font-mono text-[11px] font-bold leading-snug tracking-tight text-gray-900 sm:text-xs">
                {fecha}
              </p>
            </div>
            <DashCell label="Asiento" value={asiento} mono />
          </div>
        </div>

        {/* QR — tamaño reducido para caber en vista */}
        <div className="mt-3 flex justify-center border-t border-dashed border-gray-200 pt-3">
          <div className="text-center">
            <BoardingPassQR value={qrValue} size={72} />
            <p className="mt-1 font-mono text-[8px] uppercase tracking-wider text-gray-500">
              {isMapsQrPayload(qrValue) ? "Escanear · Cómo llegar" : "Scan / Embarque digital"}
            </p>
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
