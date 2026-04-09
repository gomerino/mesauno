import type { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { buildInvitacionEmailHtml } from "@/lib/invitacion-email";
import { nombresAcompanantes } from "@/lib/invitado-acompanantes";
import { mergeInvitadoAcompanantesIntoRows } from "@/lib/panel-invitados";
import type { Invitado } from "@/types/database";

export type BulkInvitationMode = "unsent" | "pending_rsvp";

export async function runBulkInvitationSend(
  supabase: SupabaseClient,
  params: {
    eventoId: string;
    mode: BulkInvitationMode;
    siteOrigin: string;
  }
): Promise<{ ok: true; sent: number; skipped: number; errors: string[] } | { ok: false; error: string }> {
  const { eventoId, mode, siteOrigin } = params;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    return {
      ok: false,
      error:
        "Correo no configurado. Añade RESEND_API_KEY y RESEND_FROM_EMAIL en .env.local (ver .env.local.example).",
    };
  }

  const { data: isMember, error: rpcErr } = await supabase.rpc("user_is_evento_member", {
    p_evento_id: eventoId,
  });
  if (rpcErr) {
    return { ok: false, error: rpcErr.message ?? "No se pudo comprobar la membresía" };
  }
  if (!isMember) {
    return { ok: false, error: "No autorizado para este evento" };
  }

  const { data: evento, error: evErr } = await supabase
    .from("eventos")
    .select("id, nombre_novio_1, nombre_novio_2")
    .eq("id", eventoId)
    .maybeSingle();
  if (evErr || !evento) {
    return { ok: false, error: "Evento no encontrado" };
  }

  let q = supabase.from("invitados").select("*").eq("evento_id", eventoId).not("email", "is", null);

  if (mode === "unsent") {
    q = q.eq("email_enviado", false);
  } else {
    q = q.eq("rsvp_estado", "pendiente");
  }

  const { data: rows, error: listErr } = await q;
  if (listErr) {
    return { ok: false, error: listErr.message };
  }

  const merged = await mergeInvitadoAcompanantesIntoRows(
    supabase,
    (rows ?? []) as Record<string, unknown>[]
  );
  const list = merged as unknown as Invitado[];
  if (list.length === 0) {
    return { ok: true, sent: 0, skipped: 0, errors: [] };
  }

  const n1 = evento.nombre_novio_1 ?? "";
  const n2 = evento.nombre_novio_2 ?? "";
  const firmantes = [n1, n2].filter(Boolean).join(" y ") || "Los novios";

  const resend = new Resend(apiKey);
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const inv of list) {
    const email = inv.email?.trim();
    if (!email) {
      skipped += 1;
      continue;
    }

    const token = inv.token_acceso ?? inv.id;
    const link = `${siteOrigin.replace(/\/$/, "")}/invitacion/${token}`;
    const invRow = inv as Invitado;
    const saludoNombres = [invRow.nombre_pasajero?.trim(), ...nombresAcompanantes(invRow)]
      .filter(Boolean)
      .join(", ");

    const html = buildInvitacionEmailHtml({ link, firmantes, saludoNombres });
    const { error: sendErr } = await resend.emails.send({
      from,
      to: email,
      subject: `Tu invitación — ${firmantes}`,
      html,
    });

    if (sendErr) {
      errors.push(`${email}: ${sendErr.message ?? "error"}`);
      continue;
    }

    const now = new Date().toISOString();
    const { error: upErr } = await supabase
      .from("invitados")
      .update({
        email_enviado: true,
        fecha_envio: now,
      })
      .eq("id", inv.id);

    if (upErr) {
      errors.push(`${email}: enviado pero no se pudo guardar estado (${upErr.message})`);
      continue;
    }
    sent += 1;
  }

  return { ok: true, sent, skipped, errors };
}
