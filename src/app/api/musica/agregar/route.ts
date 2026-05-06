import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  MUSICA_LIMITE_SUGERENCIAS_POR_PERSONA,
  musicaAgregarAporteInvitado,
  musicaAgregarAporteNovio,
  musicaContarSugerenciasActivasInvitado,
  musicaContarSugerenciasActivasUsuarioMiembro,
  musicaInvitadoPuedeAgregar,
  musicaUsuarioMiembroEvento,
} from "@/lib/musica-colaborativa";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: {
    invitacion_token?: string | null;
    evento_id?: string | null;
    spotify_id?: string | null;
    titulo?: string | null;
    artista?: string | null;
    imagen?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "json", message: "JSON inválido" }, { status: 400 });
  }

  const eventoId = body.evento_id?.trim() ?? "";
  const spotifyId = body.spotify_id?.trim() ?? "";
  const titulo = body.titulo?.trim() ?? "";
  const artista = body.artista?.trim() ?? "";
  const imagen = typeof body.imagen === "string" ? body.imagen.trim() || null : null;

  if (!eventoId || !spotifyId || !titulo) {
    return NextResponse.json({ code: "validacion", message: "Faltan datos obligatorios." }, { status: 400 });
  }

  const db = await createServiceClient();
  const token = body.invitacion_token?.trim() ?? "";

  if (token) {
    const gate = await musicaInvitadoPuedeAgregar(db, token, eventoId);
    if (!gate.ok) {
      return NextResponse.json({ code: "no_autorizado", message: "No autorizado." }, { status: 403 });
    }
    const ya = await musicaContarSugerenciasActivasInvitado(db, eventoId, gate.invitado_id);
    if (ya >= MUSICA_LIMITE_SUGERENCIAS_POR_PERSONA) {
      return NextResponse.json({ code: "limite", message: "Límite de canciones alcanzado" }, { status: 400 });
    }
    const res = await musicaAgregarAporteInvitado(db, {
      evento_id: eventoId,
      invitado_id: gate.invitado_id,
      spotify_id: spotifyId,
      titulo,
      artista,
      imagen,
    });
    if (!res.ok) {
      return NextResponse.json({ code: res.code, message: "No se pudo guardar." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, duplicado: res.duplicado === true });
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

  const cuentaNovio = await musicaContarSugerenciasActivasUsuarioMiembro(db, eventoId, user.id);
  if (cuentaNovio >= MUSICA_LIMITE_SUGERENCIAS_POR_PERSONA) {
    return NextResponse.json({ code: "limite", message: "Límite de canciones alcanzado" }, { status: 400 });
  }

  const res = await musicaAgregarAporteNovio(db, {
    evento_id: eventoId,
    usuario_id: user.id,
    spotify_id: spotifyId,
    titulo,
    artista,
    imagen,
  });
  if (!res.ok) {
    return NextResponse.json({ code: res.code, message: "No se pudo guardar." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, duplicado: res.duplicado === true });
}
