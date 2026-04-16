import { selectEventoForMember } from "@/lib/evento-membership";
import { createClient, createStrictServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Mock de activación de plan para desarrollo local.
 * Solo habilitado en NODE_ENV=development.
 */
export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    "id, plan_status"
  );
  if (evErr) {
    return NextResponse.json({ error: "No se pudo resolver el evento." }, { status: 500 });
  }
  if (!evento?.id) {
    return NextResponse.json({ error: "No tienes evento activo." }, { status: 404 });
  }

  const planStatus = (evento as { plan_status?: string | null }).plan_status ?? null;
  if (planStatus === "paid") {
    return NextResponse.json({ ok: true, already_active: true, plan_status: planStatus });
  }

  const { error: upErr } = await supabase
    .from("eventos")
    .update({ plan_status: "paid" })
    .eq("id", evento.id);

  if (upErr) {
    return NextResponse.json({ error: "No se pudo activar el plan mock." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, already_active: false, plan_status: "paid" });
}
