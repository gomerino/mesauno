import { musicaDjSetSincronizarColaConVotos } from "@/lib/musica-modo-dj";
import { musicaDjRequireAcceso, musicaDjJsonBody } from "@/lib/musica-dj-http";
import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await musicaDjJsonBody(request);
  const eventoId = typeof body.evento_id === "string" ? body.evento_id.trim() : "";
  const sincronizar = body.sincronizar !== false;
  if (!eventoId) {
    return NextResponse.json({ ok: false, message: "evento_id requerido." }, { status: 400 });
  }

  const gate = await musicaDjRequireAcceso(request, eventoId, "admin", body);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, message: gate.message }, { status: gate.status });
  }

  const db = await createServiceClient();
  const ok = await musicaDjSetSincronizarColaConVotos(db, eventoId, sincronizar);
  if (!ok) {
    return NextResponse.json({ ok: false, message: "No se pudo guardar la preferencia." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
