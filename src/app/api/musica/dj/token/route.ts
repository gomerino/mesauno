import { musicaDjRegenerarToken } from "@/lib/musica-modo-dj";
import { musicaDjRequireAcceso, musicaDjJsonBody } from "@/lib/musica-dj-http";
import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await musicaDjJsonBody(request);
  const eventoId = typeof body.evento_id === "string" ? body.evento_id.trim() : "";
  if (!eventoId) {
    return NextResponse.json({ ok: false, message: "evento_id requerido." }, { status: 400 });
  }

  const gate = await musicaDjRequireAcceso(request, eventoId, "admin", body);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, message: gate.message }, { status: gate.status });
  }

  const db = await createServiceClient();
  const token = await musicaDjRegenerarToken(db, eventoId);
  if (!token) {
    return NextResponse.json({ ok: false, message: "No se pudo generar el enlace." }, { status: 500 });
  }

  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (typeof request.headers.get("origin") === "string" ? request.headers.get("origin")! : "");
  const url = base ? `${base}/dj/${eventoId}?dj_acceso=${encodeURIComponent(token)}` : `/dj/${eventoId}?dj_acceso=${encodeURIComponent(token)}`;

  return NextResponse.json({ ok: true, dj_acceso: token, url_enlace_dj: url });
}
