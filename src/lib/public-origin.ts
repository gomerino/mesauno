import { headers } from "next/headers";

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * Garantiza `http(s)://host[:puerto]` para `new URL()` y Supabase `redirectTo`.
 * Acepta valores mal configurados sin esquema (p. ej. `localhost:3000`, `midominio.com`).
 */
export function ensureAbsoluteSiteOrigin(input: string): string {
  const s = input.trim();
  if (!s) return "http://localhost:3000";

  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withProto);
    const h = u.hostname.toLowerCase();
    const useHttp = h === "localhost" || h === "127.0.0.1" || h === "::1";
    const proto = useHttp ? "http:" : u.protocol === "http:" ? "http:" : "https:";
    return `${proto}//${u.host}`;
  } catch {
    return "http://localhost:3000";
  }
}

/**
 * Dominio público fijado por entorno (recomendado para enlaces de Auth/correos).
 * `SITE_URL` solo servidor; `NEXT_PUBLIC_SITE_URL` cliente + servidor.
 */
export function getCanonicalSiteOriginFromEnv(): string | null {
  const raw = process.env.SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return raw ? trimTrailingSlash(raw) : null;
}

/** URL canónica pública (dominio real). Prioridad: env → Vercel → cabeceras proxy. */
function originFromVercel(): string | null {
  const v = process.env.VERCEL_URL?.trim();
  if (!v || v.includes("localhost")) return null;
  const host = v.replace(/^https?:\/\//, "");
  return `https://${host}`;
}

/**
 * Origen público para enlaces en correos y APIs (evita localhost si hay otra señal).
 * En producción define NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
 */
export function getPublicOriginFromRequest(request: Request): string {
  const fromEnv = getCanonicalSiteOriginFromEnv();
  if (fromEnv) {
    return fromEnv;
  }

  const fromVercel = originFromVercel();
  if (fromVercel) {
    return fromVercel;
  }

  const forwardedHost =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    request.headers.get("host") ??
    "";
  if (forwardedHost && !forwardedHost.includes("localhost")) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
      (forwardedHost.includes("127.0.0.1") ? "http" : "https");
    return `${proto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

/** URL pública del sitio (Server Components, QR, enlaces). */
export async function getSiteOrigin(): Promise<string> {
  const fromEnv = getCanonicalSiteOriginFromEnv();
  if (fromEnv) {
    return fromEnv;
  }

  const fromVercel = originFromVercel();
  if (fromVercel) {
    return fromVercel;
  }

  const h = await headers();
  const host = h.get("x-forwarded-host")?.split(",")[0]?.trim() ?? h.get("host");
  if (!host) {
    return "http://localhost:3000";
  }
  if (!host.includes("localhost")) {
    const proto = h.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

function isLocalLoopbackHost(hostHeader: string): boolean {
  const host = hostHeader.split(":")[0]?.toLowerCase() ?? "";
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

/**
 * Como `getSiteOrigin()`, pero si la petición llega a **localhost / 127.0.0.1** (dev),
 * usa ese origen aunque `NEXT_PUBLIC_SITE_URL` apunte a producción. Así el magic link y
 * `redirectTo` de Supabase no mandan a mesauno.vercel.app mientras pruebas en local.
 */
export async function getSiteOriginRespectingLocalhost(): Promise<string> {
  const h = await headers();
  const hostRaw = h.get("x-forwarded-host")?.split(",")[0]?.trim() ?? h.get("host") ?? "";
  if (hostRaw && isLocalLoopbackHost(hostRaw)) {
    const proto = (h.get("x-forwarded-proto") ?? "http").split(",")[0]?.trim() ?? "http";
    const safeProto = proto === "https" ? "https" : "http";
    return `${safeProto}://${hostRaw}`;
  }
  return getSiteOrigin();
}

/**
 * `redirectTo` del magic link post-pago. Si defines `AUTH_REDIRECT_ORIGIN` o `LOCAL_SITE_URL`,
 * gana sobre cabeceras (útil para que no vuelva a mesauno.vercel.app en local).
 */
export async function getMagicLinkRedirectOrigin(): Promise<string> {
  const forced = process.env.AUTH_REDIRECT_ORIGIN?.trim() || process.env.LOCAL_SITE_URL?.trim();
  if (forced) {
    return ensureAbsoluteSiteOrigin(forced.replace(/\/$/, ""));
  }
  return ensureAbsoluteSiteOrigin(await getSiteOriginRespectingLocalhost());
}
