"use client";

import { eventoFotoPublicUrl } from "@/lib/evento-foto-url";
import type { ProgramaHitoFotoPublic } from "@/lib/programa-con-fotos-publica";
import { ProgramaIconoLucide } from "@/lib/programa-icons";
import type { EventoProgramaHito } from "@/types/database";
import { Check, MapPin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function formatHora(hora: string): string {
  return hora?.slice(0, 5) ?? "";
}

function horaToMinutes(hora: string): number {
  const p = hora.slice(0, 5).split(":").map(Number);
  const h = p[0] ?? 0;
  const m = p[1] ?? 0;
  return h * 60 + m;
}

function nowMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
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

/** Fin del tramo del hito `i` (minutos desde medianoche): hasta el inicio del siguiente, o +3h si es el último. */
function segmentEndMinutes(hitos: EventoProgramaHito[], i: number): number {
  const mins = hitos.map((h) => horaToMinutes(h.hora));
  if (i + 1 < hitos.length) return mins[i + 1]!;
  return mins[i]! + 3 * 60;
}

/** Índice del hito “en curso” el día del evento: desde hora del hito hasta la del siguiente. */
function liveHitoIndex(hitos: EventoProgramaHito[], now: Date): number {
  if (hitos.length === 0) return -1;
  const cur = nowMinutes(now);
  const mins = hitos.map((h) => horaToMinutes(h.hora));
  for (let i = 0; i < mins.length; i++) {
    const start = mins[i]!;
    const end = i + 1 < mins.length ? mins[i + 1]! : start + 3 * 60;
    if (cur >= start && cur < end) return i;
  }
  return -1;
}

/** Próximo hito con hora de inicio estrictamente posterior a `now`. */
function nextHitoIndex(hitos: EventoProgramaHito[], now: Date): number {
  const cur = nowMinutes(now);
  for (let i = 0; i < hitos.length; i++) {
    if (horaToMinutes(hitos[i]!.hora) > cur) return i;
  }
  return -1;
}

function isSegmentPast(i: number, hitos: EventoProgramaHito[], cur: number): boolean {
  return cur >= segmentEndMinutes(hitos, i);
}

type MomentState = "neutral" | "past" | "live" | "next" | "later";

function getMomentState(
  i: number,
  hitos: EventoProgramaHito[],
  now: Date,
  eventDay: boolean,
  liveIdx: number,
  nextIdx: number
): MomentState {
  if (!eventDay) return "neutral";
  const cur = nowMinutes(now);
  if (liveIdx === i) return "live";
  if (isSegmentPast(i, hitos, cur)) return "past";
  if (nextIdx === i) return "next";
  return "later";
}

type Props = {
  hitos: EventoProgramaHito[];
  /** Fecha del evento (YYYY-MM-DD o ISO); define el día en que aplica “Ahora”. */
  fechaEvento: string | null;
  /** Miniaturas por momento del programa (`hito.id`). */
  fotosPorHito?: Record<string, ProgramaHitoFotoPublic[]>;
};

export function InvitacionCronograma({ hitos, fechaEvento, fotosPorHito }: Props) {
  const [now, setNow] = useState(() => new Date());
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const eventDay = useMemo(() => sameLocalCalendarDay(fechaEvento, now), [fechaEvento, now]);
  const liveIdx = useMemo(() => (eventDay ? liveHitoIndex(hitos, now) : -1), [eventDay, hitos, now]);
  const nextIdx = useMemo(() => (eventDay ? nextHitoIndex(hitos, now) : -1), [eventDay, hitos, now]);

  /** Centrar en vista el hito “Ahora” o, si no aplica, el “Próximo”. */
  useEffect(() => {
    const target = liveIdx >= 0 ? liveIdx : nextIdx >= 0 ? nextIdx : -1;
    if (target < 0) return;
    const t = window.setTimeout(() => {
      itemRefs.current[target]?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 100);
    return () => window.clearTimeout(t);
  }, [liveIdx, nextIdx, hitos.length]);

  if (hitos.length === 0) return null;

  const statusBanner = (() => {
    if (!eventDay) return null;
    if (liveIdx >= 0) {
      const h = hitos[liveIdx]!;
      return (
        <p className="mt-2 rounded-lg border border-teal-300/60 bg-teal-50/95 px-3 py-2.5 text-[12px] leading-snug text-teal-950 shadow-sm">
          <span className="font-semibold text-teal-800">Ahora · </span>
          {h.titulo}
          <span className="text-teal-800/80"> · {formatHora(h.hora)}</span>
        </p>
      );
    }
    if (nextIdx >= 0) {
      const h = hitos[nextIdx]!;
      return (
        <p className="mt-2 rounded-lg border border-[#001d66]/15 bg-[#001d66]/[0.06] px-3 py-2.5 text-[12px] leading-snug text-[#001d66] shadow-sm">
          <span className="font-semibold">Siguiente · </span>
          {h.titulo}
          <span className="opacity-85"> · {formatHora(h.hora)}</span>
        </p>
      );
    }
    return (
      <p className="mt-2 rounded-lg border border-gray-200 bg-gray-50/90 px-3 py-2.5 text-[12px] leading-snug text-gray-600">
        El programa de hoy ya terminó. ¡Gracias por haber sido parte!
      </p>
    );
  })();

  return (
    <section
      className="mb-4 rounded-xl border border-[#001d66]/20 bg-gradient-to-br from-white to-[#f8f9ff] p-4 shadow-[0_2px_16px_rgba(0,29,102,0.08)] sm:p-5"
      aria-label="Itinerario del día"
    >
      <div className="border-b border-[#001d66]/10 pb-3">
        <h2 className="font-display text-sm font-bold tracking-wide text-[#001d66]">Itinerario</h2>
        <p className="mt-1 text-[11px] leading-snug text-[#001d66]/55">
          El plan del día, momento a momento
        </p>
        {statusBanner}
      </div>

      <ol className="relative mt-4 list-none space-y-0 pl-0">
        {hitos.map((h, i) => {
          const state = getMomentState(i, hitos, now, eventDay, liveIdx, nextIdx);
          const isLive = state === "live";
          const isPast = state === "past";
          const isNext = state === "next";
          const isLast = i === hitos.length - 1;

          const cardClass =
            state === "live"
              ? "border-teal-400/90 bg-teal-50/95 shadow-[0_4px_20px_rgba(20,184,166,0.18)] ring-2 ring-teal-400/30"
              : state === "next"
                ? "border-[#001d66]/35 bg-[#f0f4ff] shadow-[0_2px_14px_rgba(0,29,102,0.1)] ring-1 ring-[#001d66]/20"
                : state === "past"
                  ? "border-gray-200/90 bg-gray-50/80 opacity-[0.88]"
                  : state === "later"
                    ? "border-[#001d66]/10 bg-white/90 shadow-[0_1px_6px_rgba(0,29,102,0.05)]"
                    : "border-[#001d66]/10 bg-white/90 shadow-[0_1px_6px_rgba(0,29,102,0.05)]";

          const iconRing =
            state === "live"
              ? "border-teal-500 shadow-[0_0_0_3px_rgba(20,184,166,0.28)]"
              : state === "next"
                ? "border-[#001d66]/50 shadow-sm ring-2 ring-[#001d66]/15"
                : state === "past"
                  ? "border-gray-300 bg-gray-100"
                  : "border-[#001d66]/25";

          const lineClass =
            state === "past"
              ? "from-gray-300/50 to-gray-200/30"
              : isLive || isNext
                ? "from-teal-400/40 to-[#001d66]/15"
                : "from-[#001d66]/28 to-[#001d66]/08";

          return (
            <li
              key={h.id}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="flex items-stretch gap-3 sm:gap-4"
              aria-current={isLive ? "step" : undefined}
            >
              <div className="flex w-11 shrink-0 flex-col items-center self-stretch sm:w-12">
                <span
                  className={`relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-white shadow-sm sm:h-11 sm:w-11 ${iconRing}`}
                >
                  {isPast ? (
                    <Check className="h-4 w-4 text-gray-500 sm:h-[1.1rem] sm:w-[1.1rem]" strokeWidth={2.5} aria-hidden />
                  ) : (
                    <ProgramaIconoLucide
                      nombre={h.icono}
                      className={`h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem] ${isPast ? "text-gray-500" : "text-[#001d66]"}`}
                    />
                  )}
                </span>
                {!isLast ? (
                  <span
                    className={`mx-auto mt-0 w-0.5 flex-1 min-h-[1.5rem] bg-gradient-to-b ${lineClass}`}
                    aria-hidden
                  />
                ) : null}
              </div>

              <div className={`min-w-0 flex-1 rounded-xl border px-3 py-3 sm:px-4 sm:py-3.5 ${cardClass} ${isLast ? "mb-0" : "mb-4"}`}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p
                    className={`font-mono text-lg font-bold tabular-nums tracking-tight sm:text-xl ${
                      isPast ? "text-gray-500" : "text-[#001d66]"
                    }`}
                  >
                    {formatHora(h.hora)}
                  </p>
                  {isLive ? (
                    <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Ahora
                    </span>
                  ) : null}
                  {isNext ? (
                    <span className="rounded-full bg-[#001d66] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Próximo
                    </span>
                  ) : null}
                  {isPast && !isLive ? (
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/20 text-[10px] font-semibold leading-none text-emerald-700"
                      aria-label="Momento completado"
                      title="Momento completado"
                    >
                      ✓
                    </span>
                  ) : null}
                </div>
                <h3
                  className={`mt-1.5 font-display text-[15px] font-semibold leading-snug sm:text-base ${
                    isPast ? "text-gray-600" : "text-gray-900"
                  }`}
                >
                  {h.titulo}
                </h3>
                {h.descripcion_corta ? (
                  <p className={`mt-2 text-[13px] leading-relaxed sm:text-sm ${isPast ? "text-gray-500" : "text-gray-600"}`}>
                    {h.descripcion_corta}
                  </p>
                ) : null}
                {h.lugar_nombre ? (
                  <p className={`mt-3 flex items-start gap-1.5 text-xs font-medium ${isPast ? "text-gray-500" : "text-gray-500"}`}>
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#001d66]/70" aria-hidden />
                    <span>{h.lugar_nombre}</span>
                  </p>
                ) : null}
                {h.ubicacion_url?.trim() ? (
                  <a
                    href={h.ubicacion_url.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex w-fit items-center rounded-full border border-[#001d66]/25 bg-[#001d66]/[0.06] px-3 py-1.5 text-xs font-semibold text-[#001d66] transition hover:bg-[#001d66]/10"
                  >
                    Ver mapa
                  </a>
                ) : null}
                {fotosPorHito?.[h.id]?.length ? (
                  <ul
                    className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#001d66]/20"
                    aria-label="Recuerdos de este momento"
                  >
                    {fotosPorHito[h.id]!.map((f) => (
                      <li key={f.id} className="shrink-0">
                        <a
                          href={eventoFotoPublicUrl(f.storage_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#001d66]/40 focus-visible:ring-offset-2 rounded-lg"
                        >
                          <img
                            src={eventoFotoPublicUrl(f.storage_path)}
                            alt=""
                            width={72}
                            height={72}
                            loading="lazy"
                            decoding="async"
                            className="h-[4.5rem] w-[4.5rem] rounded-lg border border-[#001d66]/10 object-cover sm:h-[5rem] sm:w-[5rem]"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
