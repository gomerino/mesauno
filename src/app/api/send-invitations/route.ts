import { createClient } from "@/lib/supabase/server";
import { getPublicOriginFromRequest } from "@/lib/public-origin";
import { runBulkInvitationSend, type BulkInvitationMode } from "@/lib/send-invitations-bulk";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: { evento_id?: string; mode?: BulkInvitationMode };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const eventoId = body.evento_id?.trim();
  if (!eventoId) {
    return NextResponse.json({ error: "evento_id requerido" }, { status: 400 });
  }

  const mode: BulkInvitationMode = body.mode === "pending_rsvp" ? "pending_rsvp" : "unsent";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const siteOrigin = getPublicOriginFromRequest(request);
  const result = await runBulkInvitationSend(supabase, { eventoId, mode, siteOrigin });

  if (!result.ok) {
    let status = 400;
    if (result.error.includes("configurado")) status = 503;
    else if (result.error.includes("No autorizado") || result.error.includes("membresía")) status = 403;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    skipped: result.skipped,
    errors: result.errors,
  });
}
