import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  obtenerProveedorPropio,
  subirMedioProveedor,
  SubirMedioError,
} from "@/lib/proveedores";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const proveedor = await obtenerProveedorPropio(supabase, user.id);
  if (!proveedor) {
    return NextResponse.json(
      { error: "Todavía no tienes un perfil de proveedor." },
      { status: 404 },
    );
  }

  const form = await request.formData();
  const archivo = form.get("archivo");
  const alt = (form.get("alt") as string | null) ?? null;

  if (!(archivo instanceof Blob)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }

  const contentType =
    (archivo as File).type ||
    (form.get("contentType") as string | null) ||
    "application/octet-stream";

  try {
    const result = await subirMedioProveedor(supabase, {
      proveedorId: proveedor.id,
      plan: proveedor.plan,
      input: { archivo, contentType, alt },
    });
    return NextResponse.json({ ok: true, medio: result.medio }, { status: 201 });
  } catch (err) {
    if (err instanceof SubirMedioError) {
      const status =
        err.code === "cap-plan-free"
          ? 402
          : err.code === "mime-invalido" || err.code === "tamano-excedido"
            ? 400
            : 500;
      return NextResponse.json(
        { error: err.message, code: err.code, detalle: err.detalle },
        { status },
      );
    }
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
