import type { Invitado } from "@/types/database";

export const INVITACION_THEME_IDS = ["legacy", "soft-aviation"] as const;
export type InvitacionThemeId = (typeof INVITACION_THEME_IDS)[number];

/** Resuelve el tema a renderizar (columna `invitados.theme_id`). */
export function resolveInvitacionThemeId(invitado: Pick<Invitado, "theme_id">): InvitacionThemeId {
  const raw = invitado.theme_id?.trim();
  if (raw === "soft-aviation") return "soft-aviation";
  return "legacy";
}
