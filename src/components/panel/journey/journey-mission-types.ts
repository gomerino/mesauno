/**
 * Tipos compartidos para franjas de misiones (Viaje / Invitados).
 * Sin `"use client"` para poder importarlos desde `lib/*` y Server Components.
 */
export type JourneyMissionStepState = "done" | "active" | "pending" | "locked";

export type JourneyMissionStep = {
  id: string;
  /** Etiqueta corta (una palabra ideal). */
  label: string;
  state: JourneyMissionStepState;
  /** Línea breve bajo la etiqueta: qué falta o «Listo». */
  micro?: string;
};

export type MissionStripProps = {
  steps: JourneyMissionStep[];
  doneCount: number;
  totalCount: number;
  ariaLabel?: string;
  /** En un card sin texto encima, oculta el `border-t` inicial del componente. */
  noTopRule?: boolean;
  /** Oculta la fila «Misiones» + contador (más bajo; el progreso sigue visible). */
  hideMisionesLabel?: boolean;
  /** Márgenes y círculos un poco más chicos. */
  compact?: boolean;
};
