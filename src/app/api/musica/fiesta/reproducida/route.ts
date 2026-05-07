import { createClient, createServiceClient } from "@/lib/supabase/server";
import { musicaUsuarioPuedeModerarPlaylist } from "@/lib/musica-colaborativa";
import { musicaFiestaMarcarReproducida } from "@/lib/musica-fiesta-en-vivo";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { evento_id?: string | null; aporte_id?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "json", message: "JSON inválido" }, { status: 400 });
  }

  const eventoId = body.evento_id?.trim() ?? "";
  const aporteId = body.aporte_id?.trim() ?? "";
  if (!eventoId || !aporteId) {
    return NextResponse.json({ code: "validacion", message: "Datos incompletos." }, { status: 400 });
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
    return NextResponse.json({ code: "no_autorizado", message: "No autorizado." }, { status: 403 });
  }

  const ok = await musicaFiestaMarcarReproducida(db, eventoId, aporteId);
  if (!ok) {
    return NextResponse.json({ code: "update", message: "No se pudo actualizar." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
