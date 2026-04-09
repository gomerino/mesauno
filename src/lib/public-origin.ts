import { headers } from "next/headers";

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
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
