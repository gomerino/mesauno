import { createPlanCheckoutPreferenceResponse } from "@/lib/create-plan-checkout-preference";
import { shouldUseMercadoPagoCheckoutBypass } from "@/lib/mercadopago-server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { plan?: string; nombre?: string; email?: string; bypass?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const bypass = shouldUseMercadoPagoCheckoutBypass(request, { bodyBypass: body.bypass === true });

  return createPlanCheckoutPreferenceResponse(request, {
    plan: body.plan?.trim() ?? "",
    nombre: body.nombre?.trim() ?? "",
    email: body.email?.trim().toLowerCase() ?? "",
    evento_id: null,
    bypass,
  });
}
