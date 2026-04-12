import { BoardingPassHeader } from "@/components/BoardingPassHeader";
import { buildCeremoniaCelebracionLines, type ScheduleLine } from "@/lib/evento-invitation-schedule";
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

function lugarCorto(line: string, max = 18): string {
  const t = line.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
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

function ScheduleBlock({ lines }: { lines: ScheduleLine[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="mt-4 w-full max-w-[20rem] rounded-xl border border-invite-navy/12 bg-[#FFFDF8] px-3 py-3 shadow-sm sm:px-4">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-invite-navy/45">Horarios del día</p>
      <ul className="mt-2 space-y-2 text-left">
        {lines.map((line) => (
          <li key={`${line.label}-${line.hora}`} className="flex items-baseline justify-between gap-2 text-sm text-invite-navy">
            <span className="min-w-0 font-medium">
              <span aria-hidden className="mr-1.5">
                {line.emoji}
              </span>
              {line.label}
            </span>
            <span className="shrink-0 font-inviteMono text-sm font-semibold tabular-nums text-invite-navy">{line.hora}</span>
          </li>
        ))}
      </ul>
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
 * Boarding pass: estética aerolínea con etiquetas claras y horarios reales fuera de la metáfora.
 */
export function SoftAviationTicket({ invitado, evento: _evento, merged, mapUrl, programaHitos }: Props) {
  const address = resolveDestinoParaMapa(merged.destino);
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;

  const vuelo = merged.codigo_vuelo.trim() || "DM7726";
  const embarquePrograma = horaInicioDesdePrograma(programaHitos);
  const embarque = formatHoraEmbarqueCell(embarquePrograma ?? merged.hora_embarque ?? "");
  const fecha = formatFechaDDMMMYY(merged.fecha_evento, "— — —");
  const destinoLinea = resolveDestinoParaMapa(merged.destino);
  const lugarBreve = lugarCorto(destinoLinea, 16);
  const acompanantes = nombresAcompanantes(invitado);

  const scheduleLines = buildCeremoniaCelebracionLines(programaHitos, merged.hora_embarque ?? "17:30");

  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center px-0 text-invite-navy">
      <div className="animate-ticketPrintIn mx-auto w-full overflow-hidden rounded-sm border border-invite-navy/20 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.18)]" style={{ maxWidth: "20rem", width: BP_WIDTH }}>
        <BoardingPassHeader
          originCode="SCL"
          destCode="DAY"
          palette="invite"
          routeDisplay="branded"
          airlineName="DREAMS AIRLINES"
          tagline="Juntos, para siempre"
        />

        <p className="border-b border-invite-navy/10 bg-invite-sand/40 px-3 py-1.5 text-center text-[8px] leading-snug text-invite-navy/75 sm:text-[9px]">
          Vuelo simbólico hacia nuestro matrimonio — los horarios reales están abajo.
        </p>

        <div className="px-3 py-2.5 sm:px-4 sm:py-3">
          {/* 1. Invitado(a) */}
          <div className="border-b border-dashed border-invite-navy/20 pb-2.5">
            <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-invite-navy/50">Invitado / Pasajero</p>
            <p className="mt-0.5 break-words font-inviteSerif text-lg font-bold uppercase leading-tight tracking-wide text-invite-navy sm:text-xl">
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

          {/* 2. Metáfora compacta (no sustituye horarios de abajo) */}
          <div className="mt-3 border-t border-invite-navy/20 pt-2" aria-label="Detalle simbólico del pase">
            <div className="grid w-full items-stretch [grid-template-columns:minmax(0,0.88fr)_minmax(3.1rem,1.08fr)_minmax(0,1.12fr)_minmax(0,0.88fr)]">
              <DashCell label="Código" value={vuelo} mono nowrap />
              <DashCell label="Hora" mono nowrap>
                <div className="flex h-full w-full min-w-0 items-center justify-center bg-invite-gold px-0.5 py-1 text-center font-mono text-[10px] font-bold leading-none text-invite-navy sm:px-1 sm:text-[11px]">
                  {embarque}
                </div>
              </DashCell>
              <DashCell label="Fecha" value={fecha} mono nowrap />
              <DashCell label="Lugar" value={lugarBreve} nowrap />
            </div>
            <p className="mt-1.5 text-center text-[7px] text-invite-navy/45">Referencia simbólica · no es un vuelo real</p>
          </div>

          {/* 3. Ubicación */}
          <div className="mt-3 border-t border-dashed border-invite-navy/20 pt-2.5">
            <p className="text-[8px] font-semibold uppercase tracking-widest text-invite-navy/45">Ubicación</p>
            <p className="mt-1 break-words text-center text-[11px] font-semibold leading-snug text-invite-navy sm:text-[12px]">
              <span aria-hidden className="mr-0.5">
                📍
              </span>
              {merged.lugar_evento_linea}
            </p>
          </div>

          {/* Mapas: secundario / terciario (el CTA principal es RSVP en el footer global) */}
          <div className="mt-4 border-t border-invite-navy/15 pt-3">
            <p className="mb-2 text-center text-[8px] font-semibold uppercase tracking-widest text-invite-navy/40">Cómo llegar</p>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[46px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl border-2 border-invite-navy/35 bg-white px-3 py-2.5 text-center text-[11px] font-semibold leading-snug text-invite-navy shadow-none transition hover:border-invite-navy/50 hover:bg-invite-sand/50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-invite-navy"
            >
              <MapPin className="h-4 w-4 shrink-0 stroke-[2.25] text-invite-navy" aria-hidden />
              Ver en mapa
            </a>
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex w-full items-center justify-center gap-1.5 py-2 text-[11px] font-medium text-invite-navy/80 underline decoration-invite-navy/30 underline-offset-4 transition hover:text-invite-navy"
            >
              <Navigation className="h-3.5 w-3.5 shrink-0 text-invite-navy/70" strokeWidth={2} aria-hidden />
              Abrir en Waze
            </a>
          </div>
        </div>

        <footer className="border-t border-dashed border-invite-navy/20 bg-white px-3 py-2.5 text-center sm:px-4">
          <p className="break-words text-[9px] font-medium leading-relaxed text-invite-navy/80 sm:text-[10px]">
            Gracias por ser parte de este viaje. Nos vemos en el embarque <span aria-hidden>❤️</span>
          </p>
        </footer>
      </div>

      <ScheduleBlock lines={scheduleLines} />
    </section>
  );
}
