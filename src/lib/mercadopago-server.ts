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

export function useMercadoPagoSandboxPoints(): boolean {
  return process.env.MP_USE_SANDBOX === "1" || process.env.MP_USE_SANDBOX === "true";
}
