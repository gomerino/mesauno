import crypto from "crypto";

export type ParsedMpSignature = {
  ts: string;
  v1: string;
};

/** Parsea el header `x-signature`: `ts=...,v1=...` */
export function parseMercadoPagoSignatureHeader(header: string | null): ParsedMpSignature | null {
  if (!header || typeof header !== "string") return null;
  let ts = "";
  let v1 = "";
  for (const part of header.split(",")) {
    const p = part.trim();
    const eq = p.indexOf("=");
    if (eq < 0) continue;
    const key = p.slice(0, eq).trim();
    const value = p.slice(eq + 1).trim();
    if (key === "ts") ts = value;
    if (key === "v1") v1 = value;
  }
  if (!ts || !v1) return null;
  return { ts, v1 };
}

/**
 * Valida origen Mercado Pago según documentación oficial (manifest + HMAC-SHA256 hex).
 * @see https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks
 */
export function verifyMercadoPagoWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
  secret: string;
}): boolean {
  const parsed = parseMercadoPagoSignatureHeader(params.xSignature);
  if (!parsed || !params.xRequestId) return false;

  const manifest = `id:${params.dataId};request-id:${params.xRequestId};ts:${parsed.ts};`;
  const expected = crypto.createHmac("sha256", params.secret).update(manifest).digest("hex");

  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(parsed.v1, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Ventana opcional anti-replay (ms desde `ts` del header). */
export function mercadoPagoTimestampFresh(ts: string, maxSkewMs: number): boolean {
  const n = Number(ts);
  if (!Number.isFinite(n)) return false;
  const t = ts.length >= 13 ? n : n * 1000;
  return Math.abs(Date.now() - t) <= maxSkewMs;
}
