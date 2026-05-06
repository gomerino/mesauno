/**
 * Línea breve para hero o meta, a partir de la carta (motivo del viaje).
 * Toma la primera línea con texto y recorta a `maxLen`.
 */
export function epigrafeDesdeMotivo(motivo: string | null | undefined, maxLen = 120): string | null {
  if (motivo == null || !String(motivo).trim()) return null;
  const first = String(motivo)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!first) return null;
  const t = first.replace(/\s+/g, " ");
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1).trim()}…`;
}
