import type { Evento, Invitado } from "@/types/database";

export const INVITACION_THEME_IDS = ["legacy", "soft-aviation"] as const;
export type InvitacionThemeId = (typeof INVITACION_THEME_IDS)[number];

export const INVITACION_THEMES: Array<{
  id: InvitacionThemeId;
  name: string;
  tagline: string;
}> = [
  {
    id: "legacy",
    name: "Clásico",
    tagline: "Tipografía elegante, estética atemporal.",
  },
  {
    id: "soft-aviation",
    name: "Premium Aviation",
    tagline: "Boarding pass editorial con detalles aeronáuticos.",
  },
];

function normalize(raw: unknown): InvitacionThemeId | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  if (v === "soft-aviation" || v === "premium") return "soft-aviation";
  if (v === "legacy") return "legacy";
  return null;
}

/**
 * Resuelve el tema a renderizar.
 *
 * Orden de prioridad:
 * 1. `?theme=soft-aviation|premium|legacy` (override de vista previa).
 * 2. `eventos.theme_id` (fuente de verdad del evento).
 * 3. `invitados.theme_id` (compatibilidad con datos antiguos; se deprecará).
 * 4. Default `"legacy"`.
 */
export function resolveInvitacionThemeId(
  source:
    | Pick<Invitado, "theme_id">
    | { evento?: Pick<Evento, "theme_id"> | null; invitado?: Pick<Invitado, "theme_id"> | null },
  themeQuery?: string | null
): InvitacionThemeId {
  const fromQuery = normalize(themeQuery);
  if (fromQuery) return fromQuery;

  if ("theme_id" in source && !("evento" in source) && !("invitado" in source)) {
    // Compatibilidad con callers viejos que pasaban solo el invitado.
    return normalize(source.theme_id) ?? "legacy";
  }

  const payload = source as { evento?: Pick<Evento, "theme_id"> | null; invitado?: Pick<Invitado, "theme_id"> | null };
  const fromEvento = normalize(payload.evento?.theme_id ?? null);
  if (fromEvento) return fromEvento;

  const fromInvitado = normalize(payload.invitado?.theme_id ?? null);
  if (fromInvitado) return fromInvitado;

  return "legacy";
}
