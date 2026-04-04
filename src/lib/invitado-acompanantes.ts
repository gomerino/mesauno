import type { Invitado } from "@/types/database";

/** Orden estable por columna `orden` en BD. */
export function sortInvitadoAcompanantes(
  rows: NonNullable<Invitado["invitado_acompanantes"]>
) {
  return [...rows].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
}

/**
 * Nombres de acompañantes: primero filas en `invitado_acompanantes`, si no hay, el campo legacy
 * `nombre_acompanante` (una sola persona).
 */
export function nombresAcompanantes(inv: Invitado): string[] {
  const rows = inv.invitado_acompanantes;
  if (rows?.length) {
    return sortInvitadoAcompanantes(rows)
      .map((r) => r.nombre.trim())
      .filter(Boolean);
  }
  if (inv.nombre_acompanante?.trim()) {
    return [inv.nombre_acompanante.trim()];
  }
  return [];
}
