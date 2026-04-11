"use client";

import { ProgramaIconoLucide } from "@/lib/programa-icons";
import type { EventoProgramaHito } from "@/types/database";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const eventDay = useMemo(() => sameLocalCalendarDay(fechaEvento, now), [fechaEvento, now]);
  const liveIdx = useMemo(() => (eventDay ? liveHitoIndex(hitos, now) : -1), [eventDay, hitos, now]);

  const scrollToIndex = useCallback((i: number) => {
    const clamped = Math.max(0, Math.min(hitos.length - 1, i));
    const el = slideRefs.current[clamped];
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    setActiveIdx(clamped);
  }, [hitos.length]);

  /** Centrar el hito “Ahora” cuando aplique (refs ya montados). */
  useEffect(() => {
    if (liveIdx < 0) return;
    const t = window.setTimeout(() => scrollToIndex(liveIdx), 0);
    return () => window.clearTimeout(t);
  }, [liveIdx, scrollToIndex]);

  const onScroll = useCallback(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const cx = root.scrollLeft + root.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    slideRefs.current.forEach((el, i) => {
      if (!el) return;
      const ex = el.offsetLeft + el.offsetWidth / 2;
      const d = Math.abs(ex - cx);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setActiveIdx(best);
  }, []);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [onScroll, hitos.length]);

  if (hitos.length === 0) return null;

  return (
    <section
      className="mb-4 rounded-xl border border-[#001d66]/20 bg-gradient-to-br from-white to-[#f8f9ff] p-4 shadow-[0_2px_16px_rgba(0,29,102,0.08)] sm:p-5"
      aria-roledescription="carrusel"
      aria-label="Itinerario del día"
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#001d66]/10 pb-3">
        <span className="font-display text-sm font-bold tracking-wide text-[#001d66]">Itinerario</span>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => scrollToIndex(activeIdx - 1)}
            disabled={activeIdx <= 0}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#001d66]/15 bg-white text-[#001d66] shadow-sm transition hover:bg-[#001d66]/5 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => scrollToIndex(activeIdx + 1)}
            disabled={activeIdx >= hitos.length - 1}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#001d66]/15 bg-white text-[#001d66] shadow-sm transition hover:bg-[#001d66]/5 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </div>

      <div className="relative mt-4">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 pt-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
        >
          {hitos.map((h, i) => {
            const isLive = i === liveIdx;
            return (
              <div
                key={h.id}
                role="group"
                ref={(el) => {
                  slideRefs.current[i] = el;
                }}
                className={`w-[min(calc(100vw-4.5rem),19rem)] shrink-0 snap-center snap-always sm:w-[17.5rem] ${
                  isLive ? "rounded-xl ring-2 ring-teal-500/40 ring-offset-2 ring-offset-[#f8f9ff]" : ""
                }`}
              >
                <div
                  className={`flex h-full min-h-[12rem] flex-col rounded-xl border px-4 py-4 sm:min-h-[13rem] ${
                    isLive
                      ? "border-teal-500 bg-teal-50/80 shadow-sm"
                      : "border-[#001d66]/12 bg-white/95 shadow-[0_1px_8px_rgba(0,29,102,0.06)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 bg-white shadow-sm"
                      style={{
                        borderColor: isLive ? ACCENT : `${NAVY}33`,
                        boxShadow: isLive ? `0 0 0 3px ${ACCENT}33` : undefined,
                      }}
                    >
                      <ProgramaIconoLucide nombre={h.icono} className="h-5 w-5 text-[#001d66]" />
                    </span>
                    {isLive ? (
                      <span className="shrink-0 rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Ahora
                      </span>
                    ) : null}
                  </div>
                  <p
                    className="mt-3 font-mono text-xl font-bold tabular-nums tracking-tight sm:text-2xl"
                    style={{ color: NAVY }}
                  >
                    {formatHora(h.hora)}
                  </p>
                  <h3 className="font-display text-base font-semibold leading-snug text-gray-900">{h.titulo}</h3>
                  {h.descripcion_corta ? (
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{h.descripcion_corta}</p>
                  ) : (
                    <div className="flex-1" />
                  )}
                  {h.lugar_nombre ? (
                    <p className="mt-3 flex items-center gap-1 text-xs font-medium text-gray-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#001d66]/70" aria-hidden />
                      {h.lugar_nombre}
                    </p>
                  ) : null}
                  {h.ubicacion_url?.trim() ? (
                    <a
                      href={h.ubicacion_url.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex w-fit items-center rounded-full border border-[#001d66]/25 bg-[#001d66]/[0.06] px-3 py-1 text-xs font-semibold text-[#001d66] hover:bg-[#001d66]/10"
                    >
                      Ver mapa
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2" aria-label="Posición en el itinerario">
        {hitos.map((h, i) => (
          <button
            key={h.id}
            type="button"
            aria-label={`Ir a ${formatHora(h.hora)} · ${h.titulo}`}
            onClick={() => scrollToIndex(i)}
            className={`h-2 rounded-full transition ${
              i === activeIdx ? "w-6 bg-[#001d66]" : "w-2 bg-[#001d66]/25 hover:bg-[#001d66]/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
