import { NextResponse } from "next/server";
import { getAdminSessionUser } from "@/lib/admin-auth";
import { createStrictServiceClient } from "@/lib/supabase/server";
import { esMotivoSuspension, suspenderProveedor } from "@/lib/proveedores";
import type { MotivoSuspension } from "@/lib/proveedores";
import {
  buildSuspendidoHtml,
  enviarEmailProveedor,
} from "@/lib/proveedor-emails";
import { getPublicOriginFromRequest } from "@/lib/public-origin";

type Body = {
  motivo?: string;
  detalle?: string | null;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getAdminSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const motivoRaw = (body.motivo ?? "").trim();
  if (!esMotivoSuspension(motivoRaw)) {
    return NextResponse.json(
      { error: "Motivo inválido. Valores válidos: incompleto, baja-calidad, duplicado, otro." },
      { status: 400 },
    );
  }
  const motivo = motivoRaw as MotivoSuspension;

  const admin = await createStrictServiceClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Servicio admin no configurado" },
      { status: 503 },
    );
  }

  try {
    const proveedor = await suspenderProveedor(
      admin,
      id,
      motivo,
      body.detalle ?? null,
    );

    const origin = getPublicOriginFromRequest(request);
    if (proveedor.email) {
      await enviarEmailProveedor({
        to: proveedor.email,
        subject: "Una info más para activar tu perfil",
        html: buildSuspendidoHtml({
          nombreNegocio: proveedor.nombre_negocio,
          panelUrl: `${origin}/proveedor`,
          motivo,
          detalle: body.detalle ?? undefined,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, proveedor });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error inesperado" },
      { status: 500 },
    );
  }
}
