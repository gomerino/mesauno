import { createStrictServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Body = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  /** Nombres de acompañantes (`invitado_acompanantes`). */
  companions?: string[];
  /** Si viene, actualiza el invitado existente y sincroniza acompañantes. */
  invitado_id?: string | null;
};

async function syncInvitadoAcompanantes(
  supabase: SupabaseClient,
  invitadoId: string,
  nombres: string[] | undefined
) {
  const trimmed = (nombres ?? []).map((n) => String(n).trim()).filter(Boolean);
  const { error: delErr } = await supabase.from("invitado_acompanantes").delete().eq("invitado_id", invitadoId);
  if (delErr) throw delErr;
  if (trimmed.length === 0) return;
  const rows = trimmed.map((nombre, orden) => ({
    invitado_id: invitadoId,
    nombre,
    orden,
  }));
  const { error: insErr } = await supabase.from("invitado_acompanantes").insert(rows);
  if (insErr) throw insErr;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventoId } = await params;
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const supabase = await createStrictServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "no_service" }, { status: 503 });
  }

  const companions = body.companions;

  const invitadoIdExisting = typeof body.invitado_id === "string" ? body.invitado_id.trim() : "";
  if (invitadoIdExisting) {
    const { data: row, error: fetchErr } = await supabase
      .from("invitados")
      .select("id, evento_id, token_acceso")
      .eq("id", invitadoIdExisting)
      .maybeSingle();

    if (fetchErr || !row || row.evento_id !== eventoId) {
      return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 });
    }

    const { error: upErr } = await supabase
      .from("invitados")
      .update({
        nombre_pasajero: name,
        email: body.email?.trim() || null,
        telefono: body.phone?.trim() || null,
      })
      .eq("id", row.id);

    if (upErr) {
      console.error("[api/events/guests POST update]", upErr);
      return NextResponse.json({ error: "No se pudo actualizar invitado" }, { status: 500 });
    }

    try {
      await syncInvitadoAcompanantes(supabase, row.id, companions);
    } catch (e) {
      console.error("[api/events/guests POST sync companions]", e);
      return NextResponse.json({ error: "No se pudo sincronizar acompañantes" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: row.id, token_acceso: row.token_acceso });
  }

  const qr = `qr-${randomBytes(12).toString("hex")}`;

  const { data, error } = await supabase
    .from("invitados")
    .insert({
      evento_id: eventoId,
      nombre_pasajero: name,
      email: body.email?.trim() || null,
      telefono: body.phone?.trim() || null,
      qr_code_token: qr,
      theme_id: "soft-aviation",
    })
    .select("id, token_acceso")
    .single();

  if (error) {
    console.error("[api/events/guests POST]", error);
    return NextResponse.json({ error: "No se pudo crear invitado" }, { status: 500 });
  }

  try {
    await syncInvitadoAcompanantes(supabase, data.id, companions);
  } catch (e) {
    console.error("[api/events/guests POST sync companions]", e);
    return NextResponse.json({ error: "No se pudo sincronizar acompañantes" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id, token_acceso: data.token_acceso });
}
