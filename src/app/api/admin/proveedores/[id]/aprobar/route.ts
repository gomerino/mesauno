import { NextResponse } from "next/server";
import { getAdminSessionUser } from "@/lib/admin-auth";
import { createStrictServiceClient } from "@/lib/supabase/server";
import { aprobarProveedor } from "@/lib/proveedores";
import {
  buildAprobadoHtml,
  enviarEmailProveedor,
} from "@/lib/proveedor-emails";
import { getPublicOriginFromRequest } from "@/lib/public-origin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getAdminSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = await createStrictServiceClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Servicio admin no configurado" },
      { status: 503 },
    );
  }

  try {
    const proveedor = await aprobarProveedor(admin, id);

    const origin = getPublicOriginFromRequest(request);
    if (proveedor.email) {
      await enviarEmailProveedor({
        to: proveedor.email,
        subject: "Tu perfil en Jurnex está visible",
        html: buildAprobadoHtml({
          nombreNegocio: proveedor.nombre_negocio,
          panelUrl: `${origin}/proveedor`,
          perfilPublicoUrl: `${origin}/marketplace/${proveedor.slug}`,
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
