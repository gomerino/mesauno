import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  crearServicioProveedorPropio,
  listarServiciosProveedorPropio,
  ServicioProveedorError,
  type CrearServicioProveedorInput,
} from "@/lib/proveedores";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const servicios = await listarServiciosProveedorPropio(supabase, user.id);
    return NextResponse.json({ servicios });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al listar" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: CrearServicioProveedorInput;
  try {
    body = (await request.json()) as CrearServicioProveedorInput;
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
    const servicio = await crearServicioProveedorPropio(supabase, user.id, body);
    return NextResponse.json({ ok: true, servicio }, { status: 201 });
  } catch (err) {
    if (err instanceof ServicioProveedorError) {
      const status =
        err.code === "no-autorizado"
          ? 403
          : err.code === "error-db"
            ? 500
            : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
