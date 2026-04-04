import { headers } from "next/headers";

/** URL pública del sitio (Server Components, QR, enlaces). */
export async function getSiteOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) {
    return env.replace(/\/$/, "");
  }
  const h = await headers();
  const host = h.get("host");
  if (!host) {
    return "http://localhost:3000";
  }
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** URL pública desde un Request (API routes). */
export function getPublicOriginFromRequest(request: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) {
    return env.replace(/\/$/, "");
  }
  return new URL(request.url).origin;
}
