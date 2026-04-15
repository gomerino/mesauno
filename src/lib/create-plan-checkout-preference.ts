import {
  canUseMercadoPagoNotificationUrl,
  createMercadoPagoConfig,
  formatMercadoPagoSdkError,
  isMercadoPagoSandboxMode,
  resolveBypassSuccessOrigin,
  resolvePreferenceOrigin,
  shouldUseMercadoPagoCheckoutBypass,
  validateMercadoPagoPreferenceOrigin,
} from "@/lib/mercadopago-server";
import { isPricingPlanId, PRICING_PLANS, type PricingPlanId } from "@/lib/pricing-plans";
import { createStrictServiceClient } from "@/lib/supabase/server";
import { Preference } from "mercadopago";
import { NextResponse } from "next/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function shouldExposeMercadoPagoDetail(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.MP_DEBUG_PREFERENCE_ERRORS === "1" ||
    process.env.MP_DEBUG_PREFERENCE_ERRORS === "true"
  );
}

export type CreatePlanCheckoutInput = {
  plan: string;
  nombre: string;
  email: string;
  /** Evento de onboarding ya creado; se guarda en `checkout_sessions.evento_id`. */
  evento_id?: string | null;
  bypass: boolean;
};

/**
 * Crea sesión en `checkout_sessions`, preferencia MP (o bypass) y devuelve `init_point`.
 */
export async function createPlanCheckoutPreferenceResponse(
  request: Request,
  input: CreatePlanCheckoutInput
): Promise<NextResponse> {
  const mpConfig = createMercadoPagoConfig();
  if (!input.bypass && !mpConfig) {
    return NextResponse.json({ error: "Mercado Pago no está configurado (MP_ACCESS_TOKEN)." }, { status: 503 });
  }

  const supabase = await createStrictServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Servidor sin SUPABASE_SERVICE_ROLE_KEY." }, { status: 503 });
  }

  const planRaw = input.plan?.trim();
  const nombre = input.nombre?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";

  if (!isPricingPlanId(planRaw)) {
    return NextResponse.json({ error: "Plan inválido." }, { status: 400 });
  }
  const plan = planRaw as PricingPlanId;

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (nombre.length < 2) {
    return NextResponse.json({ error: "Indica tu nombre." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  let eventoId: string | null = null;
  const rawEv = input.evento_id?.trim();
  if (rawEv) {
    if (!UUID_RE.test(rawEv)) {
      return NextResponse.json({ error: "evento_id inválido." }, { status: 400 });
    }
    eventoId = rawEv;
  }

  const origin = input.bypass ? resolveBypassSuccessOrigin(request) : resolvePreferenceOrigin(request);
  if (!input.bypass) {
    const originCheck = validateMercadoPagoPreferenceOrigin(origin);
    if (!originCheck.ok) {
      return NextResponse.json({ error: originCheck.message }, { status: 400 });
    }
  }

  const price = PRICING_PLANS[plan].priceClp;
  const title = PRICING_PLANS[plan].mpItemTitle;
  const nombreMeta = nombre.length > 255 ? nombre.slice(0, 255) : nombre;

  const { data: sessionRow, error: insErr } = await supabase
    .from("checkout_sessions")
    .insert({
      plan,
      nombre,
      email,
      status: "pending",
      ...(eventoId ? { evento_id: eventoId } : {}),
    })
    .select("id")
    .single();

  if (insErr || !sessionRow?.id) {
    console.error("[create-plan-checkout-preference] insert session", insErr);
    return NextResponse.json({ error: "No se pudo iniciar el checkout." }, { status: 500 });
  }

  const sessionId = sessionRow.id as string;

  if (input.bypass) {
    const initPoint = `/success?mp_bypass=1&checkout_session_id=${encodeURIComponent(sessionId)}`;
    return NextResponse.json({
      init_point: initPoint,
      preference_id: null,
      bypass: true,
    });
  }

  const notificationUrl = `${origin}/api/webhooks/mercadopago`;
  const preference = new Preference(mpConfig!);

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
          ...(eventoId ? { evento_id: eventoId } : {}),
        },
        back_urls: {
          success: `${origin}/success`,
          failure: `${origin}/onboarding`,
          pending: `${origin}/onboarding`,
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

    await supabase.from("checkout_sessions").update({ mp_preference_id: pref.id ?? null }).eq("id", sessionId);

    return NextResponse.json({
      init_point: initPoint,
      preference_id: pref.id ?? null,
    });
  } catch (e) {
    const mpMsg = formatMercadoPagoSdkError(e);
    console.error("[create-plan-checkout-preference]", mpMsg, e);
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
