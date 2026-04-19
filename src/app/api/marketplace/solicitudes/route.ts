import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { selectEventoForMember } from "@/lib/evento-membership";
import {
  crearSolicitud,
  CrearSolicitudError,
  obtenerProveedorPropio,
  type CrearSolicitudErrorCode,
} from "@/lib/proveedores";
import type { ProveedorSolicitudRangoPresupuesto } from "@/types/database";

const RANGOS: ProveedorSolicitudRangoPresupuesto[] = [
  "lt-500k",
  "500k-1m",
  "1m-3m",
  "gt-3m",
];

function esRango(v: unknown): v is ProveedorSolicitudRangoPresupuesto {
  return typeof v === "string" && (RANGOS as string[]).includes(v);
}

export async function POST(request: Request) {
  let body: {
    proveedorId?: string;
    mensaje?: string | null;
    canal?: string;
    rangoPresupuesto?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const proveedorId = typeof body.proveedorId === "string" ? body.proveedorId.trim() : "";
  if (!proveedorId || !/^[0-9a-f-]{36}$/i.test(proveedorId)) {
    return NextResponse.json({ error: "Proveedor no válido." }, { status: 400 });
  }

  const mensaje =
    typeof body.mensaje === "string" ? body.mensaje.trim().slice(0, 2000) : null;
  const canal =
    body.canal === "whatsapp" || body.canal === "email" ? body.canal : "en_app";

  const rangoPresupuesto =
    body.rangoPresupuesto != null && esRango(body.rangoPresupuesto)
      ? body.rangoPresupuesto
      : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "Inicia sesión para enviar una solicitud de contacto.",
        code: "no_autenticado",
      },
      { status: 401 },
    );
  }

  const propio = await obtenerProveedorPropio(supabase, user.id);
  if (propio?.id === proveedorId) {
    return NextResponse.json(
      { error: "No puedes enviarte una solicitud a tu propio perfil." },
      { status: 400 },
    );
  }

  const { data: evento } = await selectEventoForMember(
    supabase,
    user.id,
    "id, fecha_boda, fecha_evento, destino",
  );

  const fechaEventoContexto = evento?.fecha_boda ?? evento?.fecha_evento ?? null;
  const regionContexto = evento?.destino?.trim() || null;

  const rangoParaInsert: ProveedorSolicitudRangoPresupuesto | null = rangoPresupuesto;

  try {
    const resultado = await crearSolicitud(supabase, user.id, {
      proveedorId,
      canal,
      mensaje: mensaje && mensaje.length > 0 ? mensaje : null,
      eventoId: evento?.id ?? null,
      fechaEventoContexto,
      regionContexto,
      rangoPresupuesto: rangoParaInsert,
    });

    return NextResponse.json({
      ok: true,
      limitadoPorPlan: resultado.limitadoPorPlan,
      solicitudId: resultado.solicitud.id,
    });
  } catch (err) {
    if (err instanceof CrearSolicitudError) {
      const status =
        err.code === "no_autenticado"
          ? 401
          : err.code === "input_invalido"
            ? 400
            : err.code === "rate_limit_diario"
              ? 429
              : err.code === "duplicada_hoy"
                ? 409
                : err.code === "proveedor_no_disponible"
                  ? 404
                  : 500;
      return NextResponse.json(
        { error: mensajeCrearSolicitud(err.code), code: err.code },
        { status },
      );
    }
    return NextResponse.json({ error: "Error inesperado." }, { status: 500 });
  }
}

function mensajeCrearSolicitud(code: CrearSolicitudErrorCode): string {
  switch (code) {
    case "rate_limit_diario":
      return "Alcanzaste el máximo de solicitudes por hoy. Intenta mañana.";
    case "duplicada_hoy":
      return "Ya enviaste una solicitud a este profesional hoy por este canal.";
    case "proveedor_no_disponible":
      return "Este perfil no está disponible para contacto.";
    case "input_invalido":
      return "Revisa los datos e intenta de nuevo.";
    case "no_autenticado":
      return "Inicia sesión para continuar.";
    case "server_error":
      return "No pudimos registrar la solicitud. Intenta de nuevo.";
    default:
      return "No pudimos registrar la solicitud. Intenta de nuevo.";
  }
}
