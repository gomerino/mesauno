/** Meses cortos para boarding pass (misma lógica de calendario que `formatFechaEventoLarga`). */
const MESES_CORTO_BP = [
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

/**
 * Fecha estilo boarding pass (`04 ABR 27`).
 * Usa el prefijo `YYYY-MM-DD` del valor guardado (no UTC de `Date.parse`), para que coincida
 * con el texto largo del hero y no cambie de día entre móvil / zona horaria.
 */
export function formatFechaDDMMMYY(iso: string | null | undefined, fallback: string): string {
  if (!iso) return fallback;
  const ymd = String(iso).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    const dt = new Date(String(iso).trim());
    if (Number.isNaN(dt.getTime())) return fallback;
    const day = String(dt.getDate()).padStart(2, "0");
    const mon = MESES_CORTO_BP[dt.getMonth()] ?? "---";
    const yy = String(dt.getFullYear()).slice(-2);
    return `${day} ${mon} ${yy}`;
  }
  const [y, mo, d] = ymd.split("-").map(Number);
  if (!y || !mo || !d || mo < 1 || mo > 12) return fallback;
  const mon = MESES_CORTO_BP[mo - 1];
  if (!mon) return fallback;
  return `${String(d).padStart(2, "0")} ${mon} ${String(y).slice(-2)}`;
}

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
