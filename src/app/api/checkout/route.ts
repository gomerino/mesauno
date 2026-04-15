import { createPlanCheckoutPreferenceResponse } from "@/lib/create-plan-checkout-preference";
import { shouldUseMercadoPagoCheckoutBypass } from "@/lib/mercadopago-server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Checkout de plan (Esencial / Experiencia) → Mercado Pago `init_point`.
 * Acepta `nombre` / `email` opcionales si hay sesión Supabase (se rellenan desde el usuario).
 */
export async function POST(request: Request) {
  let body: {
    plan?: string;
    evento_id?: string | null;
    nombre?: string;
    email?: string;
    bypass?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const bypass = shouldUseMercadoPagoCheckoutBypass(request, { bodyBypass: body.bypass === true });

  let nombre = body.nombre?.trim() ?? "";
  let email = body.email?.trim().toLowerCase() ?? "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    if (!email && user.email) {
      email = user.email.toLowerCase();
    }
    if (nombre.length < 2) {
      const meta = user.user_metadata?.full_name;
      if (typeof meta === "string" && meta.trim().length >= 2) {
        nombre = meta.trim();
      } else if (user.email && nombre.length < 2) {
        const local = user.email.split("@")[0] ?? "";
        if (local.length >= 2) nombre = local;
      }
    }
  }

  return createPlanCheckoutPreferenceResponse(request, {
    plan: body.plan?.trim() ?? "",
    nombre,
    email,
    evento_id: body.evento_id ?? null,
    bypass,
  });
}
