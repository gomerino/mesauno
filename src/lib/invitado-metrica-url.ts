import type { InvitadoMetricaFiltro } from "@/lib/invitaciones-metricas";

/** `?metrica=` en `/panel/pasajeros` (desde clics de métricas en `/panel`). */
export function parseMetricaFiltroFromSearch(
  raw: string | string[] | undefined
): InvitadoMetricaFiltro | null {
  const s = (typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : null)?.toLowerCase().trim();
  if (!s) return null;
  if (s === "todos" || s === "invitados" || s === "lista" || s === "all") return "todos";
  if (s === "confirmados" || s === "confirmado") return "confirmados";
  if (s === "no_asistir" || s === "noasistir" || s === "declinados") return "no_asistir";
  if (s === "pendientes" || s === "pendiente" || s === "sin_responder") return "pendientes";
  return null;
}
