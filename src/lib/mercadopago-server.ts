import { getPublicOriginFromRequest } from "@/lib/public-origin";
import { MercadoPagoConfig } from "mercadopago";

export function getMpAccessToken(): string | null {
  const t = process.env.MP_ACCESS_TOKEN?.trim();
  return t && !t.startsWith("tu_") ? t : null;
}

export function getMpWebhookSecret(): string | null {
  const s = process.env.MP_WEBHOOK_SECRET?.trim();
  return s && !s.startsWith("tu_") ? s : null;
}

export function createMercadoPagoConfig(): MercadoPagoConfig | null {
  const accessToken = getMpAccessToken();
  if (!accessToken) return null;
  return new MercadoPagoConfig({ accessToken });
}

/** Precio unitario membresía (entero, moneda CLP por defecto). */
export function getMembershipUnitPrice(): number {
  const raw = process.env.MP_MEMBERSHIP_UNIT_PRICE_CLP?.trim();
  const n = raw ? Number(raw) : NaN;
  if (Number.isFinite(n) && n > 0) return Math.round(n);
  return 19_990;
}

/** Preferir `sandbox_init_point` cuando MP_USE_SANDBOX está activo (credenciales de prueba). */
export function isMercadoPagoSandboxMode(): boolean {
  return process.env.MP_USE_SANDBOX === "1" || process.env.MP_USE_SANDBOX === "true";
}

/**
 * Origen para `back_urls` y `notification_url` en la preferencia MP.
 * Prioridad: `MP_BACK_URLS_ORIGIN` (túnel ngrok / dominio real) → mismo criterio que `getPublicOriginFromRequest`.
 * Así puedes probar en localhost con `MP_BACK_URLS_ORIGIN=https://tu-app.ngrok.io` sin que MP reciba http://localhost.
 */
export function resolvePreferenceOrigin(request: Request): string {
  const raw =
    process.env.MP_BACK_URLS_ORIGIN?.trim() ||
    process.env.MP_PUBLIC_BASE_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  return getPublicOriginFromRequest(request);
}

/**
 * Con credenciales de **producción**, MP suele rechazar `back_urls` en HTTP (p. ej. localhost).
 * En sandbox suele permitirse HTTP para pruebas.
 */
export function validateMercadoPagoPreferenceOrigin(
  origin: string
): { ok: true } | { ok: false; message: string } {
  try {
    const u = new URL(origin);
    if (u.protocol === "https:") return { ok: true };
    if (isMercadoPagoSandboxMode()) return { ok: true };
    return {
      ok: false,
      message:
        "Mercado Pago (producción) exige URLs HTTPS en las redirecciones. Define MP_BACK_URLS_ORIGIN o NEXT_PUBLIC_SITE_URL con tu dominio HTTPS, o usa credenciales de prueba y MP_USE_SANDBOX=1 para desarrollo en http://localhost.",
    };
  } catch {
    return { ok: false, message: "URL base inválida para Mercado Pago." };
  }
}

/**
 * Mercado Pago suele rechazar `notification_url` si no es HTTPS público (p. ej. http://localhost).
 * En local omitimos la URL; el flujo de pago y back_urls siguen funcionando; el webhook no llegará hasta tener dominio.
 */
export function canUseMercadoPagoNotificationUrl(origin: string): boolean {
  try {
    const u = new URL(origin);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return false;
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

/** El SDK lanza el JSON del error de la API (message, error, cause[], etc.). */
export function formatMercadoPagoSdkError(err: unknown): string {
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof o.message === "string" && o.message.trim()) parts.push(o.message.trim());
    if (typeof o.error === "string" && o.error.trim()) parts.push(o.error.trim());
    const cause = o.cause;
    if (Array.isArray(cause)) {
      for (const c of cause) {
        if (c && typeof c === "object") {
          const row = c as Record<string, unknown>;
          if (typeof row.description === "string" && row.description.trim()) {
            parts.push(row.description.trim());
          }
          if (typeof row.code === "string" && row.code.trim()) parts.push(row.code.trim());
        }
      }
    }
    if (parts.length) return Array.from(new Set(parts)).join(" — ");
    try {
      return JSON.stringify(o).slice(0, 800);
    } catch {
      return String(err);
    }
  }
  return String(err);
}
