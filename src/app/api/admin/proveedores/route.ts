import { NextResponse } from "next/server";
import { getAdminSessionUser } from "@/lib/admin-auth";
import { createStrictServiceClient } from "@/lib/supabase/server";
import { listarProveedoresAdmin } from "@/lib/proveedores";
import type { ProveedorEstado } from "@/types/database";

function esEstadoValido(v: string | null): v is ProveedorEstado {
  return v === "pendiente" || v === "aprobado" || v === "suspendido";
}

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const estadoParam = url.searchParams.get("estado");
  const estado = esEstadoValido(estadoParam) ? estadoParam : "pendiente";
  const limit = Math.min(
    Math.max(1, Number(url.searchParams.get("limit") ?? "50")),
    200,
  );

  try {
    const items = await listarProveedoresAdmin(admin, { estado, limit });
    return NextResponse.json({ estado, items, total: items.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error inesperado" },
      { status: 500 },
    );
  }
}
