import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { eliminarMedioProveedor, SubirMedioError } from "@/lib/proveedores";

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
    await eliminarMedioProveedor(supabase, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SubirMedioError) {
      const status = err.code === "sin-proveedor" ? 404 : 500;
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status },
      );
    }
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
