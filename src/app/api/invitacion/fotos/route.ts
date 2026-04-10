import { createStrictServiceClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(request: Request) {
  const db = await createStrictServiceClient();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado (service role)" }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const tokenRaw = formData.get("token");
  const file = formData.get("file");
  const token = typeof tokenRaw === "string" ? tokenRaw.trim() : "";

  if (!token) {
    return NextResponse.json({ error: "Falta token de invitación" }, { status: 400 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Archivo demasiado grande (máx. 12 MB)" }, { status: 413 });
  }

  const mime = (file.type || "").toLowerCase();
  if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
    return NextResponse.json({ error: "Solo imágenes JPEG, PNG o WebP" }, { status: 415 });
  }

  const { data: inv, error: invErr } = await db
    .from("invitados")
    .select("id, evento_id")
    .or(`id.eq.${token},token_acceso.eq.${token}`)
    .maybeSingle();

  if (invErr || !inv?.evento_id) {
    return NextResponse.json({ error: "Invitación no válida" }, { status: 404 });
  }

  const eventoId = inv.evento_id as string;
  const invitadoId = inv.id as string;
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const storagePath = `${eventoId}/${randomUUID()}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await db.storage.from("fotos_eventos").upload(storagePath, buf, {
    contentType: mime,
    upsert: false,
    cacheControl: "3600",
  });

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 502 });
  }

  const { data: row, error: insErr } = await db
    .from("evento_fotos")
    .insert({
      evento_id: eventoId,
      invitado_id: invitadoId,
      storage_path: storagePath,
    })
    .select("id, evento_id, invitado_id, storage_path, created_at")
    .single();

  if (insErr || !row) {
    await db.storage.from("fotos_eventos").remove([storagePath]);
    return NextResponse.json({ error: insErr?.message ?? "No se pudo registrar la foto" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, foto: row });
}
