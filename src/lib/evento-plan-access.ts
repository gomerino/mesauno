import type { Evento } from "@/types/database";

/** Fila `eventos` o subset; `plan` puede venir como texto desde PostgREST. */
export type EventoPlanGate = {
  plan?: Evento["plan"] | string | null;
  plan_status?: Evento["plan_status"] | string | null;
};

/**
 * Valor de producto normalizado (`eventos.plan`), sin depender de mayúsculas/espacios.
 * Si la fila es antigua y solo tiene `plan_status = paid` sin `plan`, devuelve `null` y los
 * helpers aplican compatibilidad abajo.
 */
export function planProductoNormalizado(evento: EventoPlanGate | null | undefined): "esencial" | "experiencia" | null {
  const raw = evento?.plan;
  if (raw == null || typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase();
  if (s === "esencial") return "esencial";
  if (s === "experiencia") return "experiencia";
  return null;
}

/**
 * Esencial o Experiencia: envíos, copiar enlace, insistencias, CTAs base del panel.
 *
 * Compat: si `plan` viene vacío pero `plan_status === paid` (filas antes de rellenar `plan`),
 * se considera **plan contratado** (mínimo acceso de pago).
 */
export function eventoTienePlanPagado(evento: EventoPlanGate | null | undefined): boolean {
  const n = planProductoNormalizado(evento);
  if (n === "esencial" || n === "experiencia") return true;
  return evento?.plan_status === "paid";
}

/**
 * Solo Experiencia: Spotify, recuerdos, fase “en vuelo”, etc.
 *
 * Compat: `paid` sin `plan` se trata como **experiencia completa** (histórico). Si el slug
 * explícito es `esencial`, no aplica.
 */
export function eventoTienePlanExperienciaProducto(evento: EventoPlanGate | null | undefined): boolean {
  const n = planProductoNormalizado(evento);
  if (n === "experiencia") return true;
  if (n === "esencial") return false;
  return evento?.plan_status === "paid";
}
