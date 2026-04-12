import type { EventoProgramaHito } from "@/types/database";

export type ScheduleLine = { emoji: string; label: string; hora: string };

function formatHora(hora: string): string {
  const h = hora?.slice(0, 5) ?? "";
  return h ? `${h} hrs` : "";
}

function sortHitos(h: EventoProgramaHito[]) {
  return [...h].sort((a, b) => {
    const o = (a.orden ?? 0) - (b.orden ?? 0);
    if (o !== 0) return o;
    return (a.hora ?? "").localeCompare(b.hora ?? "");
  });
}

function tituloLower(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Extrae líneas legibles para Ceremonia / Celebración desde el programa.
 * Si no hay datos suficientes, devuelve null y el caller puede usar `horaEmbarque` como respaldo.
 */
export function buildCeremoniaCelebracionLines(
  hitos: EventoProgramaHito[],
  horaEmbarqueFallback: string
): ScheduleLine[] {
  const sorted = sortHitos(hitos);
  if (sorted.length === 0) {
    const h = formatHora(horaEmbarqueFallback);
    if (!h) return [];
    return [{ emoji: "🕒", label: "Inicio del evento", hora: h }];
  }

  const ceremonyIdx = sorted.findIndex((x) => {
    const t = tituloLower(x.titulo);
    return (
      x.icono === "Church" ||
      t.includes("ceremon") ||
      t.includes("misa") ||
      t.includes("iglesia") ||
      t.includes("matrimonio civ")
    );
  });

  const partyIdx = sorted.findIndex((x) => {
    const t = tituloLower(x.titulo);
    return (
      x.icono === "Beer" ||
      x.icono === "Utensils" ||
      t.includes("celebr") ||
      t.includes("fiesta") ||
      t.includes("recepcion") ||
      t.includes("recepción") ||
      t.includes("cocktail") ||
      t.includes("banquete")
    );
  });

  const lines: ScheduleLine[] = [];

  if (ceremonyIdx >= 0) {
    const h = sorted[ceremonyIdx]!;
    lines.push({
      emoji: "🕒",
      label: "Ceremonia",
      hora: formatHora(h.hora),
    });
  }

  if (partyIdx >= 0 && partyIdx !== ceremonyIdx) {
    const h = sorted[partyIdx]!;
    lines.push({
      emoji: "🎉",
      label: "Celebración",
      hora: formatHora(h.hora),
    });
  }

  if (lines.length >= 2) return lines;

  if (lines.length === 1 && sorted.length >= 2) {
    const other = sorted.find((_, i) => i !== ceremonyIdx && i !== partyIdx) ?? sorted[1];
    if (other) {
      lines.push({
        emoji: "🎉",
        label: tituloLower(other.titulo).includes("ceremon") ? "Siguiente momento" : "Celebración",
        hora: formatHora(other.hora),
      });
      return lines;
    }
  }

  if (lines.length === 0 && sorted.length >= 2) {
    return [
      { emoji: "🕒", label: "Ceremonia", hora: formatHora(sorted[0]!.hora) },
      { emoji: "🎉", label: "Celebración", hora: formatHora(sorted[1]!.hora) },
    ];
  }

  if (lines.length === 0) {
    return [{ emoji: "🕒", label: sorted[0]!.titulo || "Horario", hora: formatHora(sorted[0]!.hora) }];
  }

  return lines;
}
