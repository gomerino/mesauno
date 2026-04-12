import {
  canUseMercadoPagoNotificationUrl,
  createMercadoPagoConfig,
  formatMercadoPagoSdkError,
  isMercadoPagoSandboxMode,
  resolvePreferenceOrigin,
  validateMercadoPagoPreferenceOrigin,
} from "@/lib/mercadopago-server";
import { isPricingPlanId, PRICING_PLANS } from "@/lib/pricing-plans";
import { createStrictServiceClient } from "@/lib/supabase/server";
import { Preference } from "mercadopago";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function shouldExposeMercadoPagoDetail(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.MP_DEBUG_PREFERENCE_ERRORS === "1" ||
    process.env.MP_DEBUG_PREFERENCE_ERRORS === "true"
  );
}

export async function POST(request: Request) {
  const mpConfig = createMercadoPagoConfig();
  if (!mpConfig) {
    return NextResponse.json({ error: "Mercado Pago no está configurado (MP_ACCESS_TOKEN)." }, { status: 503 });
  }

  const supabase = await createStrictServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Servidor sin SUPABASE_SERVICE_ROLE_KEY." }, { status: 503 });
  }

  let body: { plan?: string; nombre?: string; email?: string };
  try {
    body = (await request.json()) as { plan?: string; nombre?: string; email?: string };
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const plan = body.plan?.trim();
  const nombre = body.nombre?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";

  if (!isPricingPlanId(plan)) {
    return NextResponse.json({ error: "Plan inválido." }, { status: 400 });
  }
  if (nombre.length < 2) {
    return NextResponse.json({ error: "Indica tu nombre." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  const origin = resolvePreferenceOrigin(request);
  const originCheck = validateMercadoPagoPreferenceOrigin(origin);
  if (!originCheck.ok) {
    return NextResponse.json({ error: originCheck.message }, { status: 400 });
  }

  const price = PRICING_PLANS[plan].priceClp;
  const title = PRICING_PLANS[plan].mpItemTitle;
  const nombreMeta = nombre.length > 255 ? nombre.slice(0, 255) : nombre;

  const { data: sessionRow, error: insErr } = await supabase
    .from("checkout_sessions")
    .insert({ plan, nombre, email, status: "pending" })
    .select("id")
    .single();

  if (insErr || !sessionRow?.id) {
    console.error("[pricing-preference] insert session", insErr);
    return NextResponse.json({ error: "No se pudo iniciar el checkout." }, { status: 500 });
  }

  const sessionId = sessionRow.id as string;
  const notificationUrl = `${origin}/api/webhooks/mercadopago`;

  const preference = new Preference(mpConfig);

  try {
    const pref = await preference.create({
      body: {
        items: [
          {
            id: `dreams_plan_${plan}`,
            title,
            quantity: 1,
            unit_price: price,
            currency_id: "CLP",
          },
        ],
        external_reference: sessionId,
        metadata: {
          plan,
          email,
          nombre: nombreMeta,
          checkout_session_id: sessionId,
        },
        back_urls: {
          success: `${origin}/success`,
          failure: `${origin}/pricing`,
          pending: `${origin}/pricing`,
        },
        auto_return: "approved",
        ...(canUseMercadoPagoNotificationUrl(origin) ? { notification_url: notificationUrl } : {}),
      },
    });

    const initPoint = isMercadoPagoSandboxMode() ? pref.sandbox_init_point : pref.init_point;
    if (!initPoint) {
      await supabase.from("checkout_sessions").delete().eq("id", sessionId);
      return NextResponse.json({ error: "No se obtuvo init_point de Mercado Pago." }, { status: 502 });
    }

    await supabase
      .from("checkout_sessions")
      .update({ mp_preference_id: pref.id ?? null })
      .eq("id", sessionId);

    return NextResponse.json({
      init_point: initPoint,
      preference_id: pref.id ?? null,
    });
  } catch (e) {
    const mpMsg = formatMercadoPagoSdkError(e);
    console.error("[pricing-preference]", mpMsg, e);
    await supabase.from("checkout_sessions").delete().eq("id", sessionId);

    const expose = shouldExposeMercadoPagoDetail();
    return NextResponse.json(
      {
        error: "No se pudo crear la preferencia en Mercado Pago.",
        ...(expose ? { detail: mpMsg } : {}),
        hint:
          !canUseMercadoPagoNotificationUrl(origin)
            ? "Si el error menciona URLs o notificaciones: en local no enviamos notification_url salvo HTTPS público. Usa MP_BACK_URLS_ORIGIN=https://tu-tunel.ngrok.io para que back_urls y webhooks apunten a un dominio válido."
            : undefined,
      },
      { status: 502 }
    );
  }
}
