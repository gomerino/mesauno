/** ¿Hoy es el día del evento (fecha local vs `YYYY-MM-DD`)? */
export function isEventDayLocal(fechaEventoIso: string | null | undefined): boolean {
  if (!fechaEventoIso) return false;
  const day = String(fechaEventoIso).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}` === day;
}
