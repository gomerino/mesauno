import { createClient } from "@/lib/supabase/server";
import {
  createMercadoPagoConfig,
  getMembershipUnitPrice,
  isMercadoPagoSandboxMode,
} from "@/lib/mercadopago-server";
import { getPublicOriginFromRequest } from "@/lib/public-origin";
import { Preference } from "mercadopago";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const mpConfig = createMercadoPagoConfig();
  if (!mpConfig) {
    return NextResponse.json({ error: "Mercado Pago no está configurado (MP_ACCESS_TOKEN)." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  let body: { evento_id?: string };
  try {
    body = (await request.json()) as { evento_id?: string };
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const eventoId = body.evento_id?.trim();
  if (!eventoId || !UUID_RE.test(eventoId)) {
    return NextResponse.json({ error: "evento_id inválido." }, { status: 400 });
  }

  const { data: isAdmin, error: adminErr } = await supabase.rpc("user_is_evento_admin", {
    p_evento_id: eventoId,
  });
  if (adminErr || !isAdmin) {
    return NextResponse.json({ error: "Solo el administrador del evento puede contratar la membresía." }, { status: 403 });
  }

  const { data: evento, error: evErr } = await supabase
    .from("eventos")
    .select("id, nombre_novio_1, nombre_novio_2, nombre_evento, plan_status")
    .eq("id", eventoId)
    .maybeSingle();

  if (evErr || !evento) {
    return NextResponse.json({ error: "Evento no encontrado." }, { status: 404 });
  }

  if (evento.plan_status === "paid") {
    return NextResponse.json({ error: "Este evento ya tiene suscripción activa." }, { status: 400 });
  }

  const origin = getPublicOriginFromRequest(request);
  const baseDash = `${origin}/dashboard/${eventoId}`;
  const notificationUrl = `${origin}/api/webhooks/mercadopago`;

  const novios = [evento.nombre_novio_1, evento.nombre_novio_2].filter(Boolean).join(" & ");
  const label = novios || evento.nombre_evento?.trim() || "tu boda";
  const title = `Membresía Mesa Uno - Boda ${label}`;
  const unitPrice = getMembershipUnitPrice();

  const preference = new Preference(mpConfig);

  try {
    const pref = await preference.create({
      body: {
        items: [
          {
            id: "mesauno_membership",
            title,
            quantity: 1,
            unit_price: unitPrice,
            currency_id: "CLP",
          },
        ],
        external_reference: eventoId,
        metadata: { evento_id: eventoId },
        back_urls: {
          success: `${baseDash}/pago/success`,
          failure: `${baseDash}/pago/failure`,
          pending: `${baseDash}/pago/pending`,
        },
        auto_return: "approved",
        notification_url: notificationUrl,
      },
    });

    const initPoint = isMercadoPagoSandboxMode() ? pref.sandbox_init_point : pref.init_point;
    if (!initPoint) {
      return NextResponse.json({ error: "No se obtuvo init_point de Mercado Pago." }, { status: 502 });
    }

    const publicKey =
      process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.trim() || process.env.MP_PUBLIC_KEY?.trim() || null;

    return NextResponse.json({
      init_point: initPoint,
      preference_id: pref.id ?? null,
      public_key: publicKey,
    });
  } catch (e) {
    console.error("[create-preference]", e);
    return NextResponse.json({ error: "No se pudo crear la preferencia en Mercado Pago." }, { status: 502 });
  }
}
