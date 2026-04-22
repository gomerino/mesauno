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
};

export type MissionStripProps = {
  steps: JourneyMissionStep[];
  doneCount: number;
  totalCount: number;
  ariaLabel?: string;
};
