export type JourneyPhaseId = "check-in" | "despegue" | "en-vuelo";

const PHASE_MICROCOPY: Record<JourneyPhaseId, string> = {
  "check-in": "Tu viaje comienza pronto ✈️",
  despegue: "Todo listo para el gran día",
  "en-vuelo": "Disfruta la experiencia",
};

export function journeyPhaseMicrocopy(phase: JourneyPhaseId): string {
  return PHASE_MICROCOPY[phase];
}

type CalendarDay = { y: number; m: number; d: number };

function parseCalendarDay(value: string | null | undefined): CalendarDay | null {
  const s = value?.trim();
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

function todayLocalCalendar(): CalendarDay {
  const n = new Date();
  return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() };
}

function compareCalendar(a: CalendarDay, b: CalendarDay): number {
  if (a.y !== b.y) return a.y - b.y;
  if (a.m !== b.m) return a.m - b.m;
  return a.d - b.d;
}

function addCalendarDays(day: CalendarDay, delta: number): CalendarDay {
  const dt = new Date(day.y, day.m - 1, day.d + delta);
  return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() };
}

/**
 * Etapa del viaje según fecha del evento (días calendario locales):
 * - sin fecha → check-in
 * - hoy < fecha − 2 días → check-in
 * - entre fecha − 2 y fecha (inclusive) → despegue
 * - hoy > fecha → en-vuelo
 */
export function resolveJourneyPhase(
  fechaBoda: string | null | undefined,
  fechaEvento: string | null | undefined
): JourneyPhaseId {
  const eventDay = parseCalendarDay(fechaEvento) ?? parseCalendarDay(fechaBoda);
  if (!eventDay) return "check-in";

  const today = todayLocalCalendar();
  const windowStart = addCalendarDays(eventDay, -2);

  if (compareCalendar(today, windowStart) < 0) return "check-in";
  if (compareCalendar(today, eventDay) <= 0) return "despegue";
  return "en-vuelo";
}

export const JOURNEY_PHASES_UI: { id: JourneyPhaseId; label: string; href: string }[] = [
  { id: "check-in", label: "Check-in", href: "/panel/evento" },
  { id: "despegue", label: "Despegue", href: "/panel/programa" },
  { id: "en-vuelo", label: "En vuelo", href: "/panel/experiencia" },
];
