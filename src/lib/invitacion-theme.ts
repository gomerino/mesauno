import type { Invitado } from "@/types/database";

export const INVITACION_THEME_IDS = ["legacy", "soft-aviation"] as const;
export type InvitacionThemeId = (typeof INVITACION_THEME_IDS)[number];

/**
 * Resuelve el tema a renderizar.
 * - Columna `invitados.theme_id` en base de datos.
 * - Query `?theme=soft-aviation` (o `premium`) fuerza el tema premium para vista previa sin editar la DB.
 */
export function resolveInvitacionThemeId(
  invitado: Pick<Invitado, "theme_id">,
  themeQuery?: string | null
): InvitacionThemeId {
  const q = themeQuery?.trim().toLowerCase();
  if (q === "soft-aviation" || q === "premium") return "soft-aviation";
  const raw = invitado.theme_id?.trim();
  if (raw === "soft-aviation") return "soft-aviation";
  return "legacy";
}
