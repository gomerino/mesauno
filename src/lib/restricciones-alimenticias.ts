/** Columna en BD puede ser text[] (Supabase); el formulario usa texto libre separado por comas. */

export function restriccionesToDb(raw: string | null | undefined): string[] | null {
  const t = raw?.trim();
  if (!t) return null;
  const parts = t.split(/[,;]\s*/).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : null;
}

export function restriccionesFromDb(
  v: string | string[] | null | undefined
): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}
