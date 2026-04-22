"use client";

/**
 * Utilidad preparada para listas largas (200+ invitados) con @tanstack/react-virtual.
 * Las filas del panel incluyen panel expandido de detalle con altura variable; para
 * virtualizar hace falta medir con `measureElement` o fijar altura al colapsar detalle.
 *
 * Importar `useVirtualizer` desde `@tanstack/react-virtual` en el contenedor con
 * `overflow-y-auto` y altura máxima cuando se unifique altura de fila.
 */

export const INVITADOS_VIRTUAL_THRESHOLD = 150;
