import { fetchEventoForInvitado } from "@/lib/evento-boarding";
import { createServiceClient } from "@/lib/supabase/server";
import { buildPkpassForInvitado } from "@/lib/wallet/buildPkpass";
import type { Invitado } from "@/types/database";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Query id requerido" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("invitados")
    .select("*, invitado_acompanantes(*)")
    .or(`id.eq.${id},token_acceso.eq.${id}`)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 });
  }

  const invitado = data as Invitado;
  const evento = await fetchEventoForInvitado(supabase, invitado);
  const result = await buildPkpassForInvitado(invitado, evento);

  const headers = new Headers();
  headers.set("Content-Type", "application/vnd.apple.pkpass");
  headers.set(
    "Content-Disposition",
    `attachment; filename="invitacion-${id.slice(0, 8)}.pkpass"`
  );
  if (!result.signed) {
    headers.set("X-Wallet-Unsigned", "1");
    if (result.warning) {
      headers.set("X-Wallet-Warning", encodeURIComponent(result.warning.slice(0, 200)));
    }
  }

  return new NextResponse(new Uint8Array(result.buffer), { status: 200, headers });
}
