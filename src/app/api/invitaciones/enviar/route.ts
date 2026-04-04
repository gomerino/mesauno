import { createClient } from "@/lib/supabase/server";
import { nombresAcompanantes } from "@/lib/invitado-acompanantes";
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

  const { data: pareja } = await supabase
    .from("parejas")
    .select("id, nombre_novio_1, nombre_novio_2")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: invitado, error: invErr } = await supabase
    .from("invitados")
    .select("id, nombre_pasajero, email, pareja_id, owner_user_id, invitado_acompanantes(*)")
    .eq("id", invitadoId)
    .maybeSingle();

  if (invErr || !invitado) {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 });
  }

  const esDePareja = pareja && invitado.pareja_id === pareja.id;
  const esPropioSinPareja =
    invitado.pareja_id == null && invitado.owner_user_id === user.id;
  if (!esDePareja && !esPropioSinPareja) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const email = invitado.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "El invitado no tiene correo" }, { status: 400 });
  }

  const origin = getPublicOriginFromRequest(request);
  const link = `${origin}/invitacion/${invitado.id}`;
  const n1 = pareja?.nombre_novio_1 ?? "";
  const n2 = pareja?.nombre_novio_2 ?? "";
  const firmantes =
    [n1, n2].filter(Boolean).join(" y ") || user.email?.split("@")[0] || "Los novios";

  const inv = invitado as Invitado;
  const saludoNombres = [inv.nombre_pasajero?.trim(), ...nombresAcompanantes(inv)]
    .filter(Boolean)
    .join(", ");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; background: #f0f0f0; margin: 0; padding: 24px;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <tr><td style="background: #001d66; padding: 20px 24px;">
        <p style="margin: 0; color: #fff; font-size: 14px; letter-spacing: 0.12em; font-weight: 700;">DREAMS AIRLINES</p>
        <p style="margin: 8px 0 0; color: #c7d4ff; font-size: 13px;">Invitación digital</p>
      </td></tr>
      <tr><td style="padding: 28px 24px;">
        <p style="margin: 0 0 12px; font-size: 18px; color: #111;">Hola${saludoNombres ? `, ${saludoNombres}` : ""}</p>
        <p style="margin: 0 0 20px; color: #444; line-height: 1.5;">
          ${firmantes} te envían tu pase de embarque para el gran día. Abre el enlace para ver tu invitación y confirmar asistencia.
        </p>
        <p style="margin: 0 0 24px;">
          <a href="${link}" style="display: inline-block; background: #001d66; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 999px; font-weight: 600;">Ver mi invitación</a>
        </p>
        <p style="margin: 0; font-size: 12px; color: #888; word-break: break-all;">Si el botón no funciona, copia este enlace: ${link}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;

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

  return NextResponse.json({ ok: true });
}
