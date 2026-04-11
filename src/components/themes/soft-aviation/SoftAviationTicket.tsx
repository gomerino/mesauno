import { BoardingPassHeader } from "@/components/BoardingPassHeader";
import type { MergedEventoParaPase } from "@/lib/evento-boarding";
import { resolveDestinoParaMapa } from "@/lib/evento-boarding";
import { nombresAcompanantes } from "@/lib/invitado-acompanantes";
import type { Evento, EventoProgramaHito, Invitado } from "@/types/database";
import { MapPin, Navigation } from "lucide-react";
import type { ReactNode } from "react";

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

function formatFechaDDMMMYY(iso: string | null, fallback: string) {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const mon = MESES_CORTO[d.getUTCMonth()] ?? "---";
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${day} ${mon} ${yy}`;
}

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

function airportCodeFromLine(line: string, fallback: string): string {
  const w = line.trim().split(/\s+/)[0] ?? "";
  const letters = w.replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (letters.length >= 3) return letters.slice(0, 3);
  return fallback.slice(0, 3).toUpperCase();
}

/** Primera hora del programa (por `orden`, luego por hora). Fallback: null → usar `merged.hora_embarque`. */
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
  nowrap?: boolean;
}) {
  const v = value && value.length > 0 ? value : "—";
  const valueClass = `w-full text-[10px] font-bold leading-none text-invite-navy sm:text-[11px] ${mono ? "font-mono tracking-tight" : ""} ${nowrap ? "whitespace-nowrap" : "break-words"}`;
  return (
    <div className="flex h-full min-w-0 flex-col items-stretch border-r border-dotted border-invite-navy/25 px-0.5 py-1.5 text-center last:border-r-0 sm:px-1">
      <p className="w-full shrink-0 text-[7px] font-semibold uppercase leading-none tracking-wide text-invite-navy/50">
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

type Props = {
  invitado: Invitado;
  evento: Evento | null;
  merged: MergedEventoParaPase;
  mapUrl: string;
  programaHitos: EventoProgramaHito[];
};

/**
 * Boarding pass: cabecera navy + ruta como `BoardingPassHeader` (legacy),
 * paleta `invite-*`; cuerpo como `BoardingPassCard`.
 */
export function SoftAviationTicket({ invitado, evento: _evento, merged, mapUrl, programaHitos }: Props) {
  const address = resolveDestinoParaMapa(merged.destino);
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;

  const vuelo = merged.codigo_vuelo.trim() || "DM7726";
  const embarquePrograma = horaInicioDesdePrograma(programaHitos);
  const embarque = formatHoraEmbarqueCell(embarquePrograma ?? merged.hora_embarque ?? "");
  const fecha = formatFechaDDMMMYY(merged.fecha_evento, "— — —");
  const destinoLinea = resolveDestinoParaMapa(merged.destino);
  const destCode = airportCodeFromLine(destinoLinea, "LOV");
  const originCode = process.env.NEXT_PUBLIC_BOARDING_ORIGIN_CODE?.trim() || "SCL";
  const acompanantes = nombresAcompanantes(invitado);

  return (
    <section className="mx-auto px-0 text-invite-navy" style={{ width: BP_WIDTH, maxWidth: "20rem" }}>
      <div className="animate-ticketPrintIn mx-auto overflow-hidden rounded-sm border border-invite-navy/20 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.18)]">
        <BoardingPassHeader
          originCode={originCode}
          destCode={destCode}
          palette="invite"
          routeDisplay="airports"
          airlineName="DREAMS AIRLINES"
          tagline="together, forever"
        />

        <div className="px-3 py-2.5 sm:px-4 sm:py-3">
          <p className="break-words text-center text-[10px] font-medium leading-snug text-invite-navy sm:text-[11px]">
            <span aria-hidden className="mr-0.5">
              📍
            </span>
            {merged.lugar_evento_linea}
          </p>

          {/* Pasajero — mismas jerarquías que `BoardingPassCard` */}
          <div className="mt-3 border-t border-dashed border-invite-navy/20 pt-2.5">
            <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-invite-navy/50">
              Nombre del pasajero / Passenger name
            </p>
            <p className="mt-0.5 break-words font-inviteSerif text-base font-bold uppercase leading-tight tracking-wide text-invite-navy sm:text-lg">
              {invitado.nombre_pasajero}
            </p>
            {acompanantes.map((nombre, i) => (
              <p
                key={`${i}-${nombre}`}
                className="mt-1 break-words font-inviteSerif text-base font-bold uppercase leading-tight tracking-wide text-invite-navy sm:text-lg"
              >
                {nombre}
              </p>
            ))}
            <p className="mt-1.5 text-center text-[10px] font-semibold leading-snug sm:text-[11px]">
              <span className="text-invite-navy/70">Dress code:</span>{" "}
              <span className="text-invite-gold">Elegante</span>
            </p>
          </div>

          {/* Vuelo · Embarque · Fecha · Destino */}
          <div className="mt-3 border-t border-invite-navy/20 pt-2" aria-label="Detalles de vuelo">
            <div className="grid w-full items-stretch [grid-template-columns:minmax(0,0.88fr)_minmax(3.1rem,1.08fr)_minmax(0,1.12fr)_minmax(0,0.88fr)]">
              <DashCell label="Vuelo" value={vuelo} mono nowrap />
              <DashCell label="Embarque" mono nowrap>
                <div className="flex h-full w-full min-w-0 items-center justify-center bg-invite-gold px-0.5 py-1 text-center font-mono text-[10px] font-bold leading-none text-invite-navy sm:px-1 sm:text-[11px]">
                  {embarque}
                </div>
              </DashCell>
              <DashCell label="Fecha" value={fecha} mono nowrap />
              <DashCell label="Destino" value={destCode} mono nowrap />
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-invite-navy/20 bg-white px-3 py-3 sm:px-4">
          <p className="mb-2 text-center text-[8px] font-semibold uppercase tracking-widest text-invite-navy/45">
            Cómo llegar
          </p>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] touch-manipulation items-center justify-center gap-2 rounded-xl border-2 border-invite-navy/15 bg-invite-gold px-2 py-2.5 text-center text-[11px] font-semibold leading-snug text-invite-navy shadow-sm transition hover:brightness-[1.03] hover:shadow active:scale-[0.98] active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-invite-navy focus-visible:ring-offset-2"
            >
              <MapPin className="h-4 w-4 shrink-0 stroke-[2.25] text-invite-navy" aria-hidden />
              Ver en mapa
            </a>
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] touch-manipulation items-center justify-center gap-2 rounded-xl border-2 border-invite-gold bg-white px-2 py-2.5 text-center text-[11px] font-semibold leading-snug text-invite-navy shadow-sm transition hover:border-invite-navy/20 hover:bg-invite-sand hover:shadow active:scale-[0.98] active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-invite-navy focus-visible:ring-offset-2"
            >
              <Navigation className="h-4 w-4 shrink-0 stroke-[2.25] text-invite-navy" aria-hidden />
              Abrir en Waze
            </a>
          </div>
        </div>

        <footer className="border-t border-dashed border-invite-navy/20 bg-white px-3 py-2 text-center sm:px-4">
          <p className="break-words text-[9px] font-medium leading-relaxed text-invite-navy/75 sm:text-[10px]">
            Operado por Dreams Airlines
            {merged.footerNovios ? ` — ${merged.footerNovios}` : ""}. ¡Los esperamos en el embarque!
          </p>
        </footer>
      </div>
    </section>
  );
}
