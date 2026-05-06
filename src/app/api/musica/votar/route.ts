import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  musicaInvitadoPuedeAgregar,
  musicaRegistrarVoto,
  musicaUsuarioMiembroEvento,
} from "@/lib/musica-colaborativa";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: {
    invitacion_token?: string | null;
    evento_id?: string | null;
    aporte_id?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "json", message: "JSON inválido" }, { status: 400 });
  }

  const eventoId = body.evento_id?.trim() ?? "";
  const aporteId = body.aporte_id?.trim() ?? "";
  if (!eventoId || !aporteId) {
    return NextResponse.json({ code: "validacion", message: "evento_id y aporte_id son obligatorios." }, { status: 400 });
  }

  const db = await createServiceClient();
  const token = body.invitacion_token?.trim() ?? "";

  if (token) {
    const gate = await musicaInvitadoPuedeAgregar(db, token, eventoId);
    if (!gate.ok) {
      return NextResponse.json({ code: "no_autorizado", message: "No autorizado." }, { status: 403 });
    }
    const res = await musicaRegistrarVoto(db, {
      evento_id: eventoId,
      aporte_id: aporteId,
      invitado_id: gate.invitado_id,
      usuario_id: null,
    });
    if (!res.ok) {
      if (res.code === "no_aprobado") {
        return NextResponse.json({ code: res.code, message: "Solo puedes votar canciones ya aprobadas." }, { status: 400 });
      }
      return NextResponse.json({ code: res.code, message: "No se pudo registrar el voto." }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      votos: res.votos,
      ya_votado: res.ya_votado === true,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ code: "auth", message: "Inicia sesión." }, { status: 401 });
  }

  const miembro = await musicaUsuarioMiembroEvento(db, user.id, eventoId);
  if (!miembro) {
    return NextResponse.json({ code: "no_autorizado", message: "No autorizado." }, { status: 403 });
  }

  const res = await musicaRegistrarVoto(db, {
    evento_id: eventoId,
    aporte_id: aporteId,
    usuario_id: user.id,
    invitado_id: null,
  });
  if (!res.ok) {
    if (res.code === "no_aprobado") {
      return NextResponse.json({ code: res.code, message: "Solo puedes votar canciones ya aprobadas." }, { status: 400 });
    }
    return NextResponse.json({ code: res.code, message: "No se pudo registrar el voto." }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    votos: res.votos,
    ya_votado: res.ya_votado === true,
  });
}
