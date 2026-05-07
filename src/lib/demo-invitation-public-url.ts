/**
 * Invitación pública de referencia para la landing (iframe y enlaces).
 * Definir en despliegue: `NEXT_PUBLIC_DEMO_INVITATION_URL` (sin valor por defecto en código).
 */
export const DEMO_URL = (process.env.NEXT_PUBLIC_DEMO_INVITATION_URL ?? "").trim();

const SITE_ORIGIN_FALLBACK = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.jurnex.cl").replace(/\/$/, "");

/** Asegura `theme=jurnex` en query para alinear la vista embebida con marca landing. */
export function withJurnexTheme(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  try {
    const u = new URL(trimmed);
    if (!u.searchParams.get("theme")) {
      u.searchParams.set("theme", "jurnex");
    }
    return u.toString();
  } catch {
    try {
      const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
      const u = new URL(path, `${SITE_ORIGIN_FALLBACK}/`);
      if (!u.searchParams.get("theme")) {
        u.searchParams.set("theme", "jurnex");
      }
      return u.toString();
    } catch {
      const sep = trimmed.includes("?") ? "&" : "?";
      const hasTheme = /(?:^|[?&])theme=/.test(trimmed);
      return hasTheme ? trimmed : `${trimmed}${sep}theme=jurnex`;
    }
  }
}

export function tieneUrlInvitacionDemo(): boolean {
  return DEMO_URL.length > 0;
}

/** @deprecated Usar `DEMO_URL`; se mantiene por imports existentes. */
export const DEMO_INVITATION_URL = DEMO_URL;
