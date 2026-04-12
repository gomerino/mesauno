import { provisionCheckoutSessionFromPayment } from "@/lib/checkout-provision";
import { createStrictServiceClient } from "@/lib/supabase/server";
import {
  createMercadoPagoConfig,
  getMpWebhookSecret,
} from "@/lib/mercadopago-server";
import {
  mercadoPagoTimestampFresh,
  parseMercadoPagoSignatureHeader,
  verifyMercadoPagoWebhookSignature,
} from "@/lib/mercadopago-webhook";
import { MerchantOrder, Payment } from "mercadopago";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** IPN puede llegar como GET con query o POST con query/cuerpo. */
function collectNotificationIds(url: URL, json: Record<string, unknown> | null): {
  dataId: string | null;
  topic: string | null;
} {
  let dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  let topic =
    url.searchParams.get("type") ?? url.searchParams.get("topic") ?? url.searchParams.get("action");

  if (json && typeof json === "object") {
    const data = json.data as { id?: string | number } | undefined;
    if (data?.id != null && !dataId) dataId = String(data.id);
    if (typeof json.type === "string" && !topic) topic = json.type;
    if (typeof json.topic === "string" && !topic) topic = json.topic;
    if (typeof json.action === "string" && !topic) topic = json.action;
  }

  return { dataId: dataId?.trim() || null, topic: topic?.trim().toLowerCase() || null };
}

async function readNotificationPayload(req: Request): Promise<Record<string, unknown> | null> {
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return null;
  }
  if (!raw.trim()) return null;
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(raw);
    const o: Record<string, unknown> = {};
    params.forEach((v, k) => {
      o[k] = v;
    });
    return o;
  }
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

type MpPaymentLike = {
  id?: string | number;
  status?: string;
  external_reference?: string | null;
  transaction_amount?: number | null;
};

async function applyApprovedPayment(payment: MpPaymentLike): Promise<void> {
  if (payment.status !== "approved") return;

  const ref = payment.external_reference?.trim();
  if (!ref || !UUID_RE.test(ref)) {
    console.warn("[mp-webhook] external_reference inválido o ausente", payment.external_reference);
    return;
  }

  const supabase = await createStrictServiceClient();
  if (!supabase) {
    console.error("[mp-webhook] SUPABASE_SERVICE_ROLE_KEY no configurada");
    throw new Error("service_client_missing");
  }

  const { data: checkoutRow } = await supabase.from("checkout_sessions").select("id").eq("id", ref).maybeSingle();

  if (checkoutRow) {
    const result = await provisionCheckoutSessionFromPayment(payment);
    if (!result.ok) {
      console.warn("[mp-webhook] provision checkout_session", result.reason);
    }
    return;
  }

  const eventoId = ref;
  const paymentId = payment.id != null ? String(payment.id) : "";
  if (!paymentId) return;

  const { data: row, error: selErr } = await supabase
    .from("eventos")
    .select("id, plan_status, payment_id")
    .eq("id", eventoId)
    .maybeSingle();

  if (selErr || !row) {
    console.warn("[mp-webhook] evento no encontrado", eventoId, selErr?.message);
    return;
  }

  if (row.plan_status === "paid") {
    if (row.payment_id === paymentId) {
      return;
    }
    console.warn("[mp-webhook] evento ya pagado con otro pago; se ignora", eventoId, paymentId);
    return;
  }

  const { error: upErr } = await supabase
    .from("eventos")
    .update({
      plan_status: "paid",
      payment_id: paymentId,
      monto_pagado: payment.transaction_amount ?? null,
    })
    .eq("id", eventoId)
    .eq("plan_status", "trial");

  if (upErr) {
    console.error("[mp-webhook] update evento", upErr.message);
    throw upErr;
  }
}

async function processPaymentId(mp: Payment, rawId: string) {
  const payment = await mp.get({ id: rawId });
  await applyApprovedPayment(payment);
}

async function processMerchantOrderId(mpConfig: NonNullable<ReturnType<typeof createMercadoPagoConfig>>, rawId: string) {
  const orderClient = new MerchantOrder(mpConfig);
  const order = await orderClient.get({ merchantOrderId: rawId });
  const paymentClient = new Payment(mpConfig);

  const payments = order.payments ?? [];
  for (const p of payments) {
    if (p.id == null) continue;
    const full = await paymentClient.get({ id: p.id });
    await applyApprovedPayment(full);
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const secret = getMpWebhookSecret();
  if (!secret) {
    console.error("[mp-webhook] MP_WEBHOOK_SECRET no configurada");
    return NextResponse.json({ error: "webhook_secret_missing" }, { status: 503 });
  }

  const mpConfig = createMercadoPagoConfig();
  if (!mpConfig) {
    return NextResponse.json({ error: "mp_token_missing" }, { status: 503 });
  }

  const url = new URL(request.url);
  const json = await readNotificationPayload(request);
  const { dataId, topic } = collectNotificationIds(url, json);

  if (!dataId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const xSig = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  const parsedSig = parseMercadoPagoSignatureHeader(xSig);
  if (parsedSig && !mercadoPagoTimestampFresh(parsedSig.ts, 12 * 60 * 1000)) {
    return NextResponse.json({ error: "stale_signature" }, { status: 400 });
  }

  const okSig = verifyMercadoPagoWebhookSignature({
    xSignature: xSig,
    xRequestId,
    dataId,
    secret,
  });

  if (!okSig) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  try {
    const paymentApi = new Payment(mpConfig);
    const t = topic ?? "";

    if (t.includes("merchant_order") || t.includes("merchant-order")) {
      await processMerchantOrderId(mpConfig, dataId);
      return NextResponse.json({ ok: true });
    }

    if (t.includes("payment") || t === "payment.created" || t === "payment.updated") {
      await processPaymentId(paymentApi, dataId);
      return NextResponse.json({ ok: true });
    }

    try {
      await processPaymentId(paymentApi, dataId);
    } catch (firstErr) {
      console.warn("[mp-webhook] payment.get falló, probando merchant_order", firstErr);
      await processMerchantOrderId(mpConfig, dataId);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[mp-webhook]", e);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
