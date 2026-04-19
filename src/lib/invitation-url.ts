/**
 * Helpers compartidos para construir la URL pública de la invitación del cliente.
 *
 * Mantiene la misma lógica que `src/components/dashboard/WhatsAppInviteButton.tsx`
 * y `src/lib/send-invitations-bulk.ts` (token_acceso ?? id como segmento).
 */

const DEFAULT_PUBLIC_ORIGIN = "https://mesauno.vercel.app";

export function getInvitationBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  return DEFAULT_PUBLIC_ORIGIN;
}

export function buildInvitationUrl(tokenAcceso: string): string {
  const base = getInvitationBaseUrl();
  const segment = encodeURIComponent(tokenAcceso);
  return `${base}/invitacion/${segment}`;
}

export function resolveInvitationToken(row: {
  token_acceso?: string | null;
  id: string;
}): string {
  const raw = row.token_acceso?.trim();
  return raw && raw.length > 0 ? raw : row.id;
}
