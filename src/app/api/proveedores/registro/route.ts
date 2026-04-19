import { NextResponse } from "next/server";
import { createClient, createStrictServiceClient } from "@/lib/supabase/server";
import {
  registrarProveedor,
  RegistroProveedorError,
  type RegistroProveedorInput,
} from "@/lib/proveedores";
import {
  buildBienvenidaPendienteHtml,
  buildAdminNuevoProveedorHtml,
  enviarEmailProveedor,
  getAdminEmails,
} from "@/lib/proveedor-emails";
import { labelCategoria, labelRegion } from "@/lib/proveedores";
import { getPublicOriginFromRequest } from "@/lib/public-origin";

export async function POST(request: Request) {
  let body: RegistroProveedorInput;
  try {
    body = (await request.json()) as RegistroProveedorInput;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const admin = await createStrictServiceClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Servicio de registro no configurado. Falta SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  let resultado;
  try {
    resultado = await registrarProveedor(admin, body);
  } catch (err) {
    if (err instanceof RegistroProveedorError) {
      return NextResponse.json(
        { error: err.message, code: err.code, detalle: err.detalle },
        { status: err.code === "error-db" || err.code === "error-auth" ? 500 : 400 },
      );
    }
    return NextResponse.json(
      { error: "Error inesperado al registrar." },
      { status: 500 },
    );
  }

  // Auto-login con el mismo email/password para que el user quede en sesión
  // y pueda acceder a /proveedor y subir fotos en el mismo flujo.
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: body.email.trim().toLowerCase(),
    password: body.password,
  });
  const autoLoginOk = !signInErr;

  // Emails best-effort (no bloquear respuesta si fallan).
  const origin = getPublicOriginFromRequest(request);
  const panelUrl = `${origin}/proveedor`;
  const panelAdminUrl = `${origin}/admin/proveedores`;

  await enviarEmailProveedor({
    to: resultado.proveedor.email ?? body.email,
    subject: "Recibimos tu solicitud · Jurnex",
    html: buildBienvenidaPendienteHtml({
      nombreNegocio: resultado.proveedor.nombre_negocio,
      panelUrl,
    }),
  }).catch(() => {});

  const admins = getAdminEmails();
  if (admins.length > 0) {
    await enviarEmailProveedor({
      to: admins.join(","),
      subject: `Nuevo proveedor pendiente: ${resultado.proveedor.nombre_negocio}`,
      html: buildAdminNuevoProveedorHtml({
        nombreNegocio: resultado.proveedor.nombre_negocio,
        categoria: labelCategoria(resultado.proveedor.categoria_principal),
        region: labelRegion(resultado.proveedor.region),
        email: resultado.proveedor.email ?? body.email,
        panelAdminUrl,
      }),
    }).catch(() => {});
  }

  return NextResponse.json(
    {
      ok: true,
      proveedor: resultado.proveedor,
      autoLogin: autoLoginOk,
      creoUsuarioNuevo: resultado.creoUsuarioNuevo,
    },
    { status: 201 },
  );
}
