import { createClient, createServiceClient } from "@/lib/supabase/server";
import { musicaActualizarEstadoAporte, musicaUsuarioPuedeModerarPlaylist } from "@/lib/musica-colaborativa";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { aporte_id?: string | null; evento_id?: string | null; estado?: string | null };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "json", message: "JSON inválido" }, { status: 400 });
  }

  const aporteId = body.aporte_id?.trim() ?? "";
  const eventoId = body.evento_id?.trim() ?? "";
  const estado = body.estado?.trim() ?? "";

  if (!aporteId || !eventoId || (estado !== "aprobado" && estado !== "rechazado")) {
    return NextResponse.json({ code: "validacion", message: "Datos inválidos." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ code: "auth", message: "Inicia sesión." }, { status: 401 });
  }

  const db = await createServiceClient();
  const puede = await musicaUsuarioPuedeModerarPlaylist(db, user.id, eventoId);
  if (!puede) {
    return NextResponse.json(
      { code: "no_autorizado", message: "Solo quien administra o edita el evento puede aprobar canciones." },
      { status: 403 }
    );
  }

  const ok = await musicaActualizarEstadoAporte(db, aporteId, eventoId, estado);
  if (!ok) {
    return NextResponse.json({ code: "update", message: "No se pudo actualizar." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
