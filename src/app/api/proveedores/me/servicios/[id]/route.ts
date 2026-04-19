import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  actualizarServicioProveedorPropio,
  eliminarServicioProveedorPropio,
  ServicioProveedorError,
  type ActualizarServicioProveedorInput,
} from "@/lib/proveedores";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: ActualizarServicioProveedorInput;
  try {
    body = (await request.json()) as ActualizarServicioProveedorInput;
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
    const servicio = await actualizarServicioProveedorPropio(supabase, user.id, id, body);
    return NextResponse.json({ ok: true, servicio });
  } catch (err) {
    if (err instanceof ServicioProveedorError) {
      const status =
        err.code === "no-autorizado"
          ? 403
          : err.code === "no-encontrado"
            ? 404
            : err.code === "error-db"
              ? 500
              : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    await eliminarServicioProveedorPropio(supabase, user.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ServicioProveedorError) {
      const status =
        err.code === "no-autorizado"
          ? 403
          : err.code === "no-encontrado"
            ? 404
            : 500;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
