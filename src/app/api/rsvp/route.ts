import { createServiceClient } from "@/lib/supabase/server";
import { computeEstadoEnvioAfterRsvp } from "@/lib/invitado-estado-envio";
import { restriccionesToDb } from "@/lib/restricciones-alimenticias";
import type { Invitado } from "@/types/database";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: {
    invitadoId?: string;
    restricciones_alimenticias?: string | null;
    rsvp_estado?: "confirmado" | "declinado" | "pendiente";
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { invitadoId, restricciones_alimenticias, rsvp_estado } = body;
  if (!invitadoId) {
    return NextResponse.json({ error: "invitadoId requerido" }, { status: 400 });
  }

  if (rsvp_estado && !["confirmado", "declinado", "pendiente"].includes(rsvp_estado)) {
    return NextResponse.json({ error: "rsvp_estado inválido" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { data: prior, error: fetchErr } = await supabase
    .from("invitados")
    .select("id, rsvp_estado, asistencia_confirmada, invitacion_vista, email_enviado, estado_envio")
    .eq("id", invitadoId)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!prior) {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("invitados")
    .update({
      restricciones_alimenticias: restriccionesToDb(
        restricciones_alimenticias == null ? null : String(restricciones_alimenticias)
      ),
      ...(rsvp_estado
        ? {
            rsvp_estado: rsvp_estado,
            estado_envio: computeEstadoEnvioAfterRsvp(prior as Invitado, { rsvp_estado: rsvp_estado }),
          }
        : {}),
    })
    .eq("id", invitadoId)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
