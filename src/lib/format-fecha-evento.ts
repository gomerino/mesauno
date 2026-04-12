/** Fecha legible para encabezados de invitación (es-CL). */
export function formatFechaEventoLarga(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const day = String(iso).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const [y, mo, d] = day.split("-").map(Number);
  if (!y || !mo || !d) return null;
  const date = new Date(y, mo - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return null;
  }
}
