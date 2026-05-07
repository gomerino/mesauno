import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  MUSICA_LIMITE_SUGERENCIAS_POR_PERSONA,
  musicaContarSugerenciasActivasInvitado,
  musicaContarSugerenciasActivasUsuarioMiembro,
  musicaInvitadoIdDesdeToken,
  musicaInvitadoTokenValidoParaEvento,
  musicaListarAportes,
  musicaMarcarYaVotoEnItems,
  musicaUsuarioMiembroEvento,
  musicaUsuarioPuedeModerarPlaylist,
} from "@/lib/musica-colaborativa";
import { musicaFiestaLeerModoActivo } from "@/lib/musica-fiesta-en-vivo";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SIN_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
} as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const eventoId = url.searchParams.get("evento_id")?.trim() ?? "";
  const token = url.searchParams.get("invitacion_token")?.trim() ?? "";

  if (!eventoId) {
    return NextResponse.json(
      { code: "validacion", message: "evento_id requerido." },
      { status: 400, headers: SIN_CACHE }
    );
  }

  const db = await createServiceClient();
  let puedeModerar = false;
  let invitadoIdLista: string | null = null;
  let usuarioIdLista: string | null = null;

  if (token) {
    const ok = await musicaInvitadoTokenValidoParaEvento(db, token, eventoId);
    if (!ok) {
      return NextResponse.json(
        { code: "no_autorizado", message: "No autorizado." },
        { status: 403, headers: SIN_CACHE }
      );
    }
    invitadoIdLista = await musicaInvitadoIdDesdeToken(db, token, eventoId);
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
    usuarioIdLista = user.id;
    const miembro = await musicaUsuarioMiembroEvento(db, user.id, eventoId);
    if (!miembro) {
      return NextResponse.json(
        { code: "no_autorizado", message: "No autorizado." },
        { status: 403, headers: SIN_CACHE }
      );
    }
    puedeModerar = await musicaUsuarioPuedeModerarPlaylist(db, user.id, eventoId);
  }

  const listado = await musicaListarAportes(db, eventoId);
  if (!listado.ok) {
    return NextResponse.json(
      {
        code: listado.code,
        message:
          "No pudimos cargar la lista de sugerencias. Si acabas de desplegar, ejecutá las migraciones de música en Supabase.",
      },
      { status: 503, headers: SIN_CACHE }
    );
  }

  let items = listado.items;
  if (!puedeModerar) {
    items = items.filter((i) => i.estado !== "rechazado");
  }

  if (invitadoIdLista) {
    items = await musicaMarcarYaVotoEnItems(db, items, { invitado_id: invitadoIdLista });
  } else if (usuarioIdLista) {
    items = await musicaMarcarYaVotoEnItems(db, items, { usuario_id: usuarioIdLista });
  }

  let sugerencias_usadas: number | undefined;
  if (invitadoIdLista) {
    sugerencias_usadas = await musicaContarSugerenciasActivasInvitado(db, eventoId, invitadoIdLista);
  } else if (usuarioIdLista) {
    sugerencias_usadas = await musicaContarSugerenciasActivasUsuarioMiembro(db, eventoId, usuarioIdLista);
  }

  const modo_fiesta_activo = await musicaFiestaLeerModoActivo(db, eventoId);

  return NextResponse.json(
    {
      items,
      puedeModerar,
      sugerencias_usadas,
      sugerencias_max: MUSICA_LIMITE_SUGERENCIAS_POR_PERSONA,
      modo_fiesta_activo,
    },
    { headers: SIN_CACHE }
  );
}
