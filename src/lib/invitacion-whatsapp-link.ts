import type { Invitado } from "@/types/database";

/**
 * Dígitos mínimos para asumir un número de tel. válido (sin código de país, falla; con + o 2 dígitos región, ok).
 * wa.me/5491112345678
 */
function onlyDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Mín. 8 dígitos (mismo criterio que el enlace `wa.me`). */
export function invitadoTieneTelefonoWhatsapp(invitado: Invitado): boolean {
  const phone = invitado.telefono?.trim();
  if (!phone) return false;
  return onlyDigits(phone).length >= 8;
}

/**
 * Móviles: `whatsapp://send?...` suele abrir la app sin pasar por una página `wa.me` en el navegador.
 * (No es garantizable al 100 %: depende del SO, WebView, etc.)
 */
export function isWhatsappAppDeepLinkPreferred(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  const uad = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
  if (uad && typeof uad.mobile === "boolean") {
    return uad.mobile;
  }
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export type WhatsappLinkTarget = "https" | "app";

function buildInvitacionText(invitado: Invitado, siteOrigin: string): {
  d: string;
  text: string;
} | null {
  const phone = invitado.telefono?.trim();
  if (!phone) return null;
  const d = onlyDigits(phone);
  if (d.length < 8) return null;
  const base = siteOrigin.replace(/\/$/, "");
  const access = (invitado as Invitado & { token_acceso?: string | null }).token_acceso ?? invitado.id;
  const link = `${base}/invitacion/${access}`;
  const text = `Hola${
    invitado.nombre_pasajero ? `, ${invitado.nombre_pasajero.trim()}` : ""
  }. Tu invitación: ${link}`;
  return { d, text };
}

/**
 * `https://wa.me/...?text=...` o `whatsapp://send?...` o `null` si el tel. no sirve.
 */
export function buildWhatsappInvitacionHref(
  invitado: Invitado,
  siteOrigin: string,
  options?: { target?: WhatsappLinkTarget }
): string | null {
  const built = buildInvitacionText(invitado, siteOrigin);
  if (!built) return null;
  const { d, text } = built;
  const target = options?.target ?? "https";
  const q = encodeURIComponent(text);
  if (target === "app") {
    return `whatsapp://send?phone=${d}&text=${q}`;
  }
  return `https://wa.me/${d}?text=${q}`;
}

/**
 * Mismo criterio de `buildWhatsappInvitacionHref`, texto orientado a recordatorio de asistencia.
 */
export function buildWhatsappRecordatorioHref(
  invitado: Invitado,
  siteOrigin: string,
  options?: { target?: WhatsappLinkTarget }
): string | null {
  if (!invitadoTieneTelefonoWhatsapp(invitado)) return null;
  const phone = invitado.telefono!.trim();
  const d = onlyDigits(phone);
  const base = siteOrigin.replace(/\/$/, "");
  const access = (invitado as Invitado & { token_acceso?: string | null }).token_acceso ?? invitado.id;
  const link = `${base}/invitacion/${access}`;
  const nombre = invitado.nombre_pasajero?.trim();
  const text = `Hola${
    nombre ? `, ${nombre}` : ""
  }. Un recordatorio: aún no recibimos tu confirmación de asistencia. Tu invitación: ${link}`;
  const target = options?.target ?? "https";
  const q = encodeURIComponent(text);
  if (target === "app") {
    return `whatsapp://send?phone=${d}&text=${q}`;
  }
  return `https://wa.me/${d}?text=${q}`;
}
