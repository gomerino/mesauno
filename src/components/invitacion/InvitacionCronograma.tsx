"use client";

import { ProgramaIconoLucide } from "@/lib/programa-icons";
import type { EventoProgramaHito } from "@/types/database";
import { MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const NAVY = "#001d66";
const ACCENT = "#0d9488";

function formatHora(hora: string): string {
  return hora?.slice(0, 5) ?? "";
}

function horaToMinutes(hora: string): number {
  const p = hora.slice(0, 5).split(":").map(Number);
  const h = p[0] ?? 0;
  const m = p[1] ?? 0;
  return h * 60 + m;
}

function sameLocalCalendarDay(isoDate: string | null | undefined, d: Date): boolean {
  if (!isoDate) return false;
  const day = String(isoDate).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}` === day;
}

/** Índice del hito “en curso” el día del evento: desde hora del hito hasta la del siguiente. */
function liveHitoIndex(hitos: EventoProgramaHito[], now: Date): number {
  if (hitos.length === 0) return -1;
  const cur = now.getHours() * 60 + now.getMinutes();
  const mins = hitos.map((h) => horaToMinutes(h.hora));
  for (let i = 0; i < mins.length; i++) {
    const start = mins[i]!;
    const end = i + 1 < mins.length ? mins[i + 1]! : start + 3 * 60;
    if (cur >= start && cur < end) return i;
  }
  return -1;
}

type Props = {
  hitos: EventoProgramaHito[];
  /** Fecha del evento (YYYY-MM-DD o ISO); define el día en que aplica “Ahora”. */
  fechaEvento: string | null;
};

export function InvitacionCronograma({ hitos, fechaEvento }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const eventDay = useMemo(() => sameLocalCalendarDay(fechaEvento, now), [fechaEvento, now]);
  const liveIdx = useMemo(() => (eventDay ? liveHitoIndex(hitos, now) : -1), [eventDay, hitos, now]);

  if (hitos.length === 0) return null;

  return (
    <section className="mb-4 rounded-xl border border-[#001d66]/20 bg-gradient-to-br from-white to-[#f8f9ff] p-4 shadow-[0_2px_16px_rgba(0,29,102,0.08)] sm:p-5">
      <div className="flex items-center gap-2 border-b border-[#001d66]/10 pb-3">
        <span className="font-display text-sm font-bold tracking-wide text-[#001d66]">Cronograma</span>
      </div>

      <div className="relative mt-4 pl-2">
        <div className="absolute top-2 bottom-6 left-[1.15rem] w-px bg-[#001d66]/20" aria-hidden />
        <ol className="relative z-0 list-none space-y-0 p-0">
        {hitos.map((h, i) => {
          const isLive = i === liveIdx;
          return (
            <li key={h.id} className="relative flex gap-3 pb-6 last:pb-0">
              <div className="relative z-[1] flex shrink-0 flex-col items-center pt-0.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white shadow-sm"
                  style={{
                    borderColor: isLive ? ACCENT : `${NAVY}33`,
                    boxShadow: isLive ? `0 0 0 3px ${ACCENT}33` : undefined,
                  }}
                >
                  <ProgramaIconoLucide nombre={h.icono} className="h-4 w-4 text-[#001d66]" />
                </span>
              </div>
              <div
                className={`min-w-0 flex-1 rounded-lg border px-3 py-2.5 sm:px-4 sm:py-3 ${
                  isLive
                    ? "border-teal-500 bg-teal-50/80 ring-1 ring-teal-500/30"
                    : "border-[#001d66]/12 bg-white/90"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p
                      className="font-mono text-lg font-bold tabular-nums tracking-tight sm:text-xl"
                      style={{ color: NAVY }}
                    >
                      {formatHora(h.hora)}
                    </p>
                    <h3 className="font-display text-base font-semibold text-gray-900">{h.titulo}</h3>
                  </div>
                  {isLive ? (
                    <span className="shrink-0 rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Ahora
                    </span>
                  ) : null}
                </div>
                {h.descripcion_corta ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{h.descripcion_corta}</p>
                ) : null}
                {h.lugar_nombre ? (
                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-gray-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[#001d66]/70" aria-hidden />
                    {h.lugar_nombre}
                  </p>
                ) : null}
                {h.ubicacion_url?.trim() ? (
                  <a
                    href={h.ubicacion_url.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center rounded-full border border-[#001d66]/25 bg-[#001d66]/[0.06] px-3 py-1 text-xs font-semibold text-[#001d66] hover:bg-[#001d66]/10"
                  >
                    Ver mapa
                  </a>
                ) : null}
              </div>
            </li>
          );
        })}
        </ol>
      </div>
    </section>
  );
}
