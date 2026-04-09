import { createClient } from "@/lib/supabase/server";
import { selectEventoForMember } from "@/lib/evento-membership";
import { fetchInvitadoWithAcompanantes } from "@/lib/invitado-fetch";
import { nombresAcompanantes } from "@/lib/invitado-acompanantes";
import { buildInvitacionEmailHtml } from "@/lib/invitacion-email";
import { getPublicOriginFromRequest } from "@/lib/public-origin";
import type { Invitado } from "@/types/database";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  let body: { invitadoId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const invitadoId = body.invitadoId;
  if (!invitadoId) {
    return NextResponse.json({ error: "invitadoId requerido" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    return NextResponse.json(
      {
        error:
          "Correo no configurado. Añade RESEND_API_KEY y RESEND_FROM_EMAIL en .env.local (ver .env.local.example).",
      },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: evento } = await selectEventoForMember(
    supabase,
    user.id,
    "id, nombre_novio_1, nombre_novio_2"
  );

  const { data: invitado, error: invErr } = await fetchInvitadoWithAcompanantes(
    supabase,
    invitadoId
  );

  if (invErr || !invitado) {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 });
  }

  const esDelEvento = evento && invitado.evento_id === evento.id;
  const esPropioSinEvento =
    invitado.evento_id == null && invitado.owner_user_id === user.id;
  if (!esDelEvento && !esPropioSinEvento) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const email = invitado.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "El invitado no tiene correo" }, { status: 400 });
  }

  const origin = getPublicOriginFromRequest(request);
  const inv = invitado as Invitado & { token_acceso?: string | null };
  const access = inv.token_acceso ?? invitado.id;
  const link = `${origin}/invitacion/${access}`;
  const n1 = evento?.nombre_novio_1 ?? "";
  const n2 = evento?.nombre_novio_2 ?? "";
  const firmantes =
    [n1, n2].filter(Boolean).join(" y ") || user.email?.split("@")[0] || "Los novios";

  const invRow = invitado as Invitado;
  const saludoNombres = [invRow.nombre_pasajero?.trim(), ...nombresAcompanantes(invRow)]
    .filter(Boolean)
    .join(", ");

  const html = buildInvitacionEmailHtml({ link, firmantes, saludoNombres });

  const resend = new Resend(apiKey);
  const { error: sendErr } = await resend.emails.send({
    from,
    to: email,
    subject: `Tu invitación — ${firmantes}`,
    html,
  });

  if (sendErr) {
    return NextResponse.json({ error: sendErr.message ?? "Error al enviar correo" }, { status: 502 });
  }

  const now = new Date().toISOString();
  await supabase
    .from("invitados")
    .update({ email_enviado: true, fecha_envio: now })
    .eq("id", invitado.id);

  return NextResponse.json({ ok: true });
}
