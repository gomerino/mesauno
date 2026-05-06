import { createClient, createServiceClient } from "@/lib/supabase/server";
import { musicaEjecutarSyncSpotify } from "@/lib/musica-colaborativa-spotify-sync";
import { musicaUsuarioPuedeModerarPlaylist } from "@/lib/musica-colaborativa";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { evento_id?: string | null };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "json", message: "JSON inválido" }, { status: 400 });
  }

  const eventoId = body.evento_id?.trim() ?? "";
  if (!eventoId) {
    return NextResponse.json({ code: "validacion", message: "evento_id requerido." }, { status: 400 });
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
      { code: "no_autorizado", message: "Solo quien administra o edita el evento puede sincronizar la playlist." },
      { status: 403 }
    );
  }

  const result = await musicaEjecutarSyncSpotify(db, eventoId);
  if (!result.ok) {
    return NextResponse.json({ code: "spotify", message: result.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
