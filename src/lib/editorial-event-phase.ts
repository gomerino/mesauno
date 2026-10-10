export type EditorialEventPhase = "antes" | "durante" | "despues";

/** Fase de presentación por día en Chile; no autoriza ni bloquea operaciones. */
export function editorialEventPhase(date: string | null | undefined, now: Date = new Date()): EditorialEventPhase {
  const day = date?.slice(0, 10);
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return "antes";
  const parsed = new Date(`${day}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== day) return "antes";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  const today = `${value("year")}-${value("month")}-${value("day")}`;
  return day === today ? "durante" : day > today ? "antes" : "despues";
}
