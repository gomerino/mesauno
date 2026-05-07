import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  musicaInvitadoIdDesdeToken,
  musicaInvitadoTokenValidoParaEvento,
  musicaUsuarioMiembroEvento,
} from "@/lib/musica-colaborativa";
import { musicaFiestaEstadoDetalle } from "@/lib/musica-fiesta-en-vivo";
import { musicaDjResolverAcceso } from "@/lib/musica-modo-dj";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SIN_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
} as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const eventoId = url.searchParams.get("evento_id")?.trim() ?? "";
  const token = url.searchParams.get("invitacion_token")?.trim() ?? "";
  const djAcceso = url.searchParams.get("dj_acceso")?.trim() ?? "";

  if (!eventoId) {
    return NextResponse.json(
      { code: "validacion", message: "evento_id requerido." },
      { status: 400, headers: SIN_CACHE }
    );
  }

  const db = await createServiceClient();

  if (djAcceso) {
    const accesoDj = await musicaDjResolverAcceso(db, eventoId, { userId: null, dj_token: djAcceso });
    if (!accesoDj) {
      return NextResponse.json(
        { code: "no_autorizado", message: "Acceso DJ no válido." },
        { status: 403, headers: SIN_CACHE }
      );
    }
    const detalleDj = await musicaFiestaEstadoDetalle(db, eventoId);
    return NextResponse.json(detalleDj, { headers: SIN_CACHE });
  }

  let contexto: { invitado_id: string } | { usuario_id: string } | undefined;

  if (token) {
    const ok = await musicaInvitadoTokenValidoParaEvento(db, token, eventoId);
    if (!ok) {
      return NextResponse.json(
        { code: "no_autorizado", message: "No autorizado." },
        { status: 403, headers: SIN_CACHE }
      );
    }
    const invId = await musicaInvitadoIdDesdeToken(db, token, eventoId);
    if (invId) contexto = { invitado_id: invId };
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json(
        { code: "auth", message: "Inicia sesión." },
        { status: 401, headers: SIN_CACHE }
      );
    }
    const miembro = await musicaUsuarioMiembroEvento(db, user.id, eventoId);
    if (!miembro) {
      return NextResponse.json(
        { code: "no_autorizado", message: "No autorizado." },
        { status: 403, headers: SIN_CACHE }
      );
    }
    contexto = { usuario_id: user.id };
  }

  const detalle = await musicaFiestaEstadoDetalle(db, eventoId, contexto);
  return NextResponse.json(detalle, { headers: SIN_CACHE });
}
