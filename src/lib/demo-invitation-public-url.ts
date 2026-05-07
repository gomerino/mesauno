/**
 * Invitación pública de referencia para la landing (iframe y enlaces).
 * Definir en despliegue: `NEXT_PUBLIC_DEMO_INVITATION_URL` (sin valor por defecto en código).
 */
export const DEMO_URL = (process.env.NEXT_PUBLIC_DEMO_INVITATION_URL ?? "").trim();

export function tieneUrlInvitacionDemo(): boolean {
  return DEMO_URL.length > 0;
}

/** @deprecated Usar `DEMO_URL`; se mantiene por imports existentes. */
export const DEMO_INVITATION_URL = DEMO_URL;
