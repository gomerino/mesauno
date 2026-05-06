import { createClient } from "@/lib/supabase/server";
import { selectEventoForMember } from "@/lib/evento-membership";
import { fetchInvitadoWithAcompanantes } from "@/lib/invitado-fetch";
import { nombresAcompanantes } from "@/lib/invitado-acompanantes";
import { buildInvitacionEmailHtml } from "@/lib/invitacion-email";
import { getPublicOriginFromRequest } from "@/lib/public-origin";
import type { CanalEnvioInvitacion, Invitado } from "@/types/database";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const CANAL_VALUES: readonly CanalEnvioInvitacion[] = ["correo", "whatsapp", "ambos"];

function isCanal(v: unknown): v is CanalEnvioInvitacion {
  return typeof v === "string" && (CANAL_VALUES as readonly string[]).includes(v);
}

export async function POST(request: Request) {
  let body: { invitadoId?: string; eventoId?: string | null; canal?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Algo no encajó al enviar. Vuelve a la lista e inténtalo otra vez." },
      { status: 400 }
    );
  }

  const invitadoId = body.invitadoId;
  const eventoIdBody = body.eventoId?.trim() || null;
  const canal: CanalEnvioInvitacion = isCanal(body.canal) ? body.canal : "ambos";

  if (!invitadoId) {
    return NextResponse.json(
      { error: "Falta a quién va la carta. Vuelve a la lista e inténtalo otra vez." },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    return NextResponse.json(
      {
        error:
          "Aún no podemos mandar el correo desde Jurnex. Hace falta dejar listo el servicio de avisos (quien cuida el sitio lo conoce).",
      },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Hace falta iniciar sesión." }, { status: 401 });
  }

  const { data: invitado, error: invErr } = await fetchInvitadoWithAcompanantes(
    supabase,
    invitadoId
  );

  if (invErr || !invitado) {
    return NextResponse.json({ error: "No encontramos a esta persona en la lista." }, { status: 404 });
  }

  if (eventoIdBody) {
    if (invitado.evento_id !== eventoIdBody) {
      return NextResponse.json(
        { error: "Esa ficha no corresponde a vuestro evento." },
        { status: 400 }
      );
    }
    const { data: isMember, error: rpcErr } = await supabase.rpc("user_is_evento_member", {
      p_evento_id: eventoIdBody,
    });
    if (rpcErr) {
      return NextResponse.json(
        { error: rpcErr.message ?? "No pudimos comprobar vuestro acceso. Vuelve a entrar o inténtalo luego." },
        { status: 500 }
      );
    }
    if (!isMember) {
      return NextResponse.json({ error: "No tienes permiso para avisar en este evento." }, { status: 403 });
    }
  } else {
    const { data: evento } = await selectEventoForMember(
      supabase,
      user.id,
      "id, nombre_novio_1, nombre_novio_2"
    );
    const esDelEvento = evento && invitado.evento_id === evento.id;
    const esPropioSinEvento =
      invitado.evento_id == null && invitado.owner_user_id === user.id;
    if (!esDelEvento && !esPropioSinEvento) {
      return NextResponse.json({ error: "No puedes enviar esta invitación con la sesión actual." }, { status: 403 });
    }
  }

  const { data: eventoNombres, error: evErr } = invitado.evento_id
    ? await supabase
        .from("eventos")
        .select("id, nombre_novio_1, nombre_novio_2")
        .eq("id", invitado.evento_id)
        .maybeSingle()
    : { data: null, error: null as null };

  if (evErr) {
    return NextResponse.json({ error: "No encontramos el evento vinculado a esta ficha." }, { status: 404 });
  }

  const email = invitado.email?.trim();
  if (!email) {
    return NextResponse.json(
      { error: "A esta persona le falta un correo en la ficha. Añade el correo e inténtalo otra vez." },
      { status: 400 }
    );
  }

  const origin = getPublicOriginFromRequest(request);
  const inv = invitado as Invitado & { token_acceso?: string | null };
  const access = inv.token_acceso ?? invitado.id;
  const link = `${origin}/invitacion/${access}`;
  const n1 = eventoNombres?.nombre_novio_1 ?? "";
  const n2 = eventoNombres?.nombre_novio_2 ?? "";
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
    return NextResponse.json(
      { error: sendErr.message ?? "No salió el correo. Puede ser un fallo del servicio: inténtalo en un rato." },
      { status: 502 }
    );
  }

  const now = new Date().toISOString();
  const { error: upErr } = await supabase
    .from("invitados")
    .update({
      email_enviado: true,
      fecha_envio: now,
      estado_envio: "enviado",
      canal_envio: canal,
    })
    .eq("id", invitado.id);

  if (upErr) {
    return NextResponse.json(
      {
        error:
          upErr.message ?? "El correo pudo salir, pero no pudimos dejarlo anotado. Revisa la lista o inténtalo luego si se repite.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
