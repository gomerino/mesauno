/**
 * Invitación pública de referencia para la sección DEMO de la landing.
 * Sustituye por demo dinámico o usuario demo vía env sin tocar el componente.
 */
export const DEMO_URL =
  process.env.NEXT_PUBLIC_DEMO_INVITATION_URL?.trim() ||
  "https://mesauno.vercel.app/invitacion/2d3e70bb-9898-48f4-be5c-3b9014a7b1ec";

/** @deprecated Usar `DEMO_URL`; se mantiene por imports existentes. */
export const DEMO_INVITATION_URL = DEMO_URL;
