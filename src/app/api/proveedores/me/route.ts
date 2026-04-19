import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  actualizarProveedorPropio,
  ActualizarProveedorError,
  obtenerProveedorPropio,
  type ActualizarProveedorInput,
} from "@/lib/proveedores";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const proveedor = await obtenerProveedorPropio(supabase, user.id);
  return NextResponse.json({ proveedor });
}

export async function PATCH(request: Request) {
  let body: ActualizarProveedorInput;
  try {
    body = (await request.json()) as ActualizarProveedorInput;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const proveedor = await actualizarProveedorPropio(supabase, user.id, body);
    return NextResponse.json({ ok: true, proveedor });
  } catch (err) {
    if (err instanceof ActualizarProveedorError) {
      const status =
        err.code === "no-autorizado"
          ? 403
          : err.code === "error-db"
            ? 500
            : 400;
      return NextResponse.json(
        { error: err.message, code: err.code, detalle: err.detalle },
        { status },
      );
    }
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
