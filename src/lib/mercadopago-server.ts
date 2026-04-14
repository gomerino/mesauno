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

function envTruthy(v: string | undefined): boolean {
  if (!v) return false;
  const t = v.trim().toLowerCase();
  return t === "1" || t === "true" || t === "yes" || t === "on";
}

/**
 * Omite Mercado Pago: redirección a `/success?mp_bypass=1&checkout_session_id=...`.
 * `NEXT_PUBLIC_MP_CHECKOUT_BYPASS` funciona en Vercel; quítalo en producción cuando cobres de verdad.
 */
export function isMercadoPagoCheckoutBypassEnabled(): boolean {
  return (
    envTruthy(process.env.MP_CHECKOUT_BYPASS) ||
    envTruthy(process.env.NEXT_PUBLIC_MP_CHECKOUT_BYPASS)
  );
}

/** Dev local o staging explícito: permite activar bypass con `?bypass=1` sin tocar .env. */
export function isMercadoPagoCheckoutBypassContextLoose(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    envTruthy(process.env.MP_ALLOW_CLIENT_BYPASS)
  );
}

function refererHasBypassQuery(request: Request): boolean {
  const ref = request.headers.get("referer");
  if (!ref) return false;
  try {
    const u = new URL(ref);
    const b = u.searchParams.get("bypass");
    return b === "1" || envTruthy(b ?? undefined);
  } catch {
    return false;
  }
}

/**
 * True si NO debemos llamar a la API de preferencias de Mercado Pago.
 * - Siempre con MP_CHECKOUT_BYPASS / NEXT_PUBLIC_MP_CHECKOUT_BYPASS.
 * - En `development` o con MP_ALLOW_CLIENT_BYPASS: también con
 *   `POST /api/checkout/pricing-preference?bypass=1`, body `{ bypass: true }`, o referer `/pricing?bypass=1`.
 */
export function shouldUseMercadoPagoCheckoutBypass(
  request: Request,
  opts?: { bodyBypass?: boolean }
): boolean {
  if (isMercadoPagoCheckoutBypassEnabled()) return true;
  if (!isMercadoPagoCheckoutBypassContextLoose()) return false;
  try {
    const u = new URL(request.url);
    const q = u.searchParams.get("bypass");
    if (q === "1" || envTruthy(q ?? undefined)) return true;
  } catch {
    /* seguir */
  }
  if (opts?.bodyBypass === true) return true;
  if (refererHasBypassQuery(request)) return true;
  return false;
}

/** Autoriza completar el flujo en `/success?mp_bypass=1` (debe coincidir con shouldUseMercadoPagoCheckoutBypass). */
export function canProcessPricingCheckoutBypassSuccess(): boolean {
  return isMercadoPagoCheckoutBypassEnabled() || isMercadoPagoCheckoutBypassContextLoose();
}

/**
 * Origen público para la vuelta en modo bypass. Prioriza `AUTH_REDIRECT_ORIGIN` / `LOCAL_SITE_URL`
 * para forzar p. ej. `http://localhost:3000` aunque el request pase por otro host.
 */
export function resolveBypassSuccessOrigin(request: Request): string {
  const forced = process.env.AUTH_REDIRECT_ORIGIN?.trim() || process.env.LOCAL_SITE_URL?.trim();
  if (forced) {
    return forced.replace(/\/$/, "");
  }
  return resolvePreferenceOrigin(request);
}

/**
 * Origen para `back_urls` y `notification_url` en la preferencia MP.
 *
 * Prioridad:
 * 1. `MP_BACK_URLS_ORIGIN` / `MP_PUBLIC_BASE_URL` — túnel ngrok o dominio explícito.
 * 2. Si la petición al API es desde **localhost / 127.0.0.1** — usar ese origen para que la vuelta del pago sea a tu `npm run dev`, aunque `NEXT_PUBLIC_SITE_URL` apunte a producción (ej. mesauno.vercel.app).
 * 3. `getPublicOriginFromRequest` (SITE_URL / host del request en Vercel).
 */
export function resolvePreferenceOrigin(request: Request): string {
  const explicit =
    process.env.MP_BACK_URLS_ORIGIN?.trim() || process.env.MP_PUBLIC_BASE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  try {
    const reqUrl = new URL(request.url);
    const host = reqUrl.hostname.toLowerCase();
    const isLoopback = host === "localhost" || host === "127.0.0.1" || host === "::1";
    if (isLoopback) {
      return `${reqUrl.protocol}//${reqUrl.host}`;
    }
  } catch {
    /* seguir */
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
    const host = u.hostname.toLowerCase();
    if (u.protocol === "http:" && (host === "localhost" || host === "127.0.0.1")) {
      return { ok: true };
    }
    if (isMercadoPagoSandboxMode()) return { ok: true };
    return {
      ok: false,
      message:
        "Mercado Pago (producción) exige URLs HTTPS en las redirecciones (excepto localhost en desarrollo). Si usas token de producción, define MP_BACK_URLS_ORIGIN con HTTPS (ngrok) o usa credenciales de prueba y MP_USE_SANDBOX=1.",
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
