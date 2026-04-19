import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listarSolicitudesRecibidasProveedor } from "@/lib/proveedores";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const solicitudes = await listarSolicitudesRecibidasProveedor(supabase, user.id);
    return NextResponse.json({ solicitudes });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al listar" },
      { status: 500 },
    );
  }
}
