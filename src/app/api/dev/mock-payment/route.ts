import { selectEventoForMember } from "@/lib/evento-membership";
import {
  encodeMockPaymentMarker,
  isMockPaymentStatus,
  type MockPaymentStatus,
} from "@/lib/mock-payment";
import { createClient, createStrictServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ReqBody = {
  status?: string;
};

/**
 * Simulación de pago para desarrollo: approved / rejected / pending.
 * - Guarda estado mock en DB (eventos.payment_id).
 * - Solo approved activa plan_status = paid.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: ReqBody = {};
  try {
    body = (await request.json()) as ReqBody;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const status = body.status?.trim();
  if (!isMockPaymentStatus(status)) {
    return NextResponse.json({ error: "status inválido. Usa approved | rejected | pending." }, { status: 400 });
  }

  const userClient = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await userClient.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const supabase = await createStrictServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Servidor sin SUPABASE_SERVICE_ROLE_KEY." }, { status: 503 });
  }

  const { data: evento, error: evErr } = await selectEventoForMember(
    supabase,
    user.id,
    "id, plan_status, payment_id"
  );
  if (evErr) {
    return NextResponse.json({ error: "No se pudo resolver el evento." }, { status: 500 });
  }
  if (!evento?.id) {
    return NextResponse.json({ error: "No tienes evento activo." }, { status: 404 });
  }

  const patch: { payment_id: string; plan_status: "paid" | "trial" } = {
    payment_id: encodeMockPaymentMarker(status as MockPaymentStatus),
    plan_status: status === "approved" ? "paid" : "trial",
  };

  const { error: upErr } = await supabase.from("eventos").update(patch).eq("id", evento.id);
  if (upErr) {
    return NextResponse.json({ error: "No se pudo guardar mock payment." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    payment_status: status,
    plan_status: patch.plan_status,
  });
}

