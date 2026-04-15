import { createStrictServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || id.length < 10) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const supabase = await createStrictServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Servidor sin service role" }, { status: 503 });
  }

  const { data, error } = await supabase.from("eventos").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("[api/events GET]", error);
    return NextResponse.json({ error: "No se pudo leer el evento" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(data);
}

type PatchBody = {
  nombre_evento?: string;
  destino?: string;
  lugar_evento_linea?: string;
  motivo_viaje?: string | null;
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const supabase = await createStrictServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "no_service" }, { status: 503 });
  }

  const patch: Record<string, unknown> = {};
  if (body.nombre_evento != null) patch.nombre_evento = String(body.nombre_evento).trim() || null;
  if (body.destino != null) patch.destino = String(body.destino).trim() || null;
  if (body.lugar_evento_linea != null) patch.lugar_evento_linea = String(body.lugar_evento_linea).trim() || null;
  if (body.motivo_viaje !== undefined) patch.motivo_viaje = body.motivo_viaje ? String(body.motivo_viaje).trim() : null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("eventos").update(patch).eq("id", id);

  if (error) {
    console.error("[api/events PATCH]", error);
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
