import { musicaDjColaMover } from "@/lib/musica-modo-dj";
import { musicaDjRequireAcceso, musicaDjJsonBody } from "@/lib/musica-dj-http";
import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await musicaDjJsonBody(request);
  const eventoId = typeof body.evento_id === "string" ? body.evento_id.trim() : "";
  const aporteId = typeof body.aporte_id === "string" ? body.aporte_id.trim() : "";
  const direccion = body.direccion === "abajo" ? "abajo" : "arriba";
  if (!eventoId || !aporteId) {
    return NextResponse.json({ ok: false, message: "evento_id y aporte_id requeridos." }, { status: 400 });
  }

  const gate = await musicaDjRequireAcceso(request, eventoId, "dj_token", body);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, message: gate.message }, { status: gate.status });
  }

  const db = await createServiceClient();
  const ok = await musicaDjColaMover(db, eventoId, aporteId, direccion);
  if (!ok) {
    return NextResponse.json({ ok: false, message: "No se pudo mover." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
