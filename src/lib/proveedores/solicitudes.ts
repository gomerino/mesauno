import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProveedorSolicitud,
  ProveedorSolicitudCanal,
  ProveedorSolicitudRangoPresupuesto,
} from "@/types/database";
import {
  CAP_SOLICITUDES_DIA_POR_REMITENTE,
  CAP_SOLICITUDES_MES_FREE,
} from "./constants";

/**
 * Lógica de creación de solicitudes novio → proveedor.
 *
 * Defensas en capas:
 *  1. DB: UNIQUE(proveedor_id, remitente_user_id, canal, dia_solicitud) — garante final.
 *  2. DB: RLS `proveedor_solicitudes_insert_remitente` — remitente=auth.uid() + visible.
 *  3. App: rate limit global por novio (este archivo).
 *  4. App: cálculo de `limitado_por_plan` antes del insert (este archivo).
 *
 * La RPC SQL equivalente se introducirá en M06 si hace falta atomicidad
 * transaccional; por ahora la capa app + UNIQUE son suficientes para MVP.
 */

export type CrearSolicitudInput = {
  proveedorId: string;
  canal: ProveedorSolicitudCanal;
  mensaje?: string | null;
  eventoId?: string | null;
  fechaEventoContexto?: string | null;
  regionContexto?: string | null;
  rangoPresupuesto?: ProveedorSolicitudRangoPresupuesto | null;
};

export type CrearSolicitudErrorCode =
  | "rate_limit_diario"
  | "duplicada_hoy"
  | "proveedor_no_disponible"
  | "no_autenticado"
  | "input_invalido"
  | "server_error";

export class CrearSolicitudError extends Error {
  code: CrearSolicitudErrorCode;
  constructor(code: CrearSolicitudErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "CrearSolicitudError";
  }
}

export type CrearSolicitudResult = {
  solicitud: ProveedorSolicitud;
  limitadoPorPlan: boolean;
};

/**
 * Crea una solicitud. Falla con `CrearSolicitudError` mapeable a HTTP status:
 *   - no_autenticado            → 401
 *   - input_invalido            → 400
 *   - rate_limit_diario         → 429
 *   - duplicada_hoy             → 409
 *   - proveedor_no_disponible   → 409
 *   - server_error              → 500
 */
export async function crearSolicitud(
  supabase: SupabaseClient,
  remitenteUserId: string,
  input: CrearSolicitudInput,
): Promise<CrearSolicitudResult> {
  if (!remitenteUserId) {
    throw new CrearSolicitudError("no_autenticado");
  }
  if (!input.proveedorId || !input.canal) {
    throw new CrearSolicitudError("input_invalido", "proveedorId y canal son requeridos");
  }

  const inicioDiaUtc = inicioDiaUtcIso();

  // 1) Rate limit global diario del novio.
  const { count: countHoy, error: errHoy } = await supabase
    .from("proveedor_solicitudes")
    .select("id", { count: "exact", head: true })
    .eq("remitente_user_id", remitenteUserId)
    .gte("created_at", inicioDiaUtc);

  if (errHoy) throw new CrearSolicitudError("server_error", errHoy.message);
  if ((countHoy ?? 0) >= CAP_SOLICITUDES_DIA_POR_REMITENTE) {
    throw new CrearSolicitudError("rate_limit_diario");
  }

  // 2) El proveedor debe existir y estar aprobado (lectura pública vía RLS).
  //    Traemos plan + solicitudes_mes para calcular `limitado_por_plan`.
  const { data: filaProveedor, error: errProveedor } = await supabase
    .from("proveedores")
    .select("id, estado, plan, solicitudes_mes")
    .eq("id", input.proveedorId)
    .maybeSingle();

  if (errProveedor) throw new CrearSolicitudError("server_error", errProveedor.message);
  if (!filaProveedor || filaProveedor.estado !== "aprobado") {
    throw new CrearSolicitudError("proveedor_no_disponible");
  }

  const limitadoPorPlan =
    filaProveedor.plan === "free" &&
    filaProveedor.solicitudes_mes >= CAP_SOLICITUDES_MES_FREE;

  // 3) Insert. Si hay UNIQUE violation devolvemos duplicada_hoy.
  const { data: filaInsertada, error: errInsert } = await supabase
    .from("proveedor_solicitudes")
    .insert({
      proveedor_id: input.proveedorId,
      evento_id: input.eventoId ?? null,
      remitente_user_id: remitenteUserId,
      canal: input.canal,
      mensaje: input.mensaje ?? null,
      fecha_evento_contexto: input.fechaEventoContexto ?? null,
      region_contexto: input.regionContexto ?? null,
      rango_presupuesto: input.rangoPresupuesto ?? null,
      limitado_por_plan: limitadoPorPlan,
    })
    .select("*")
    .single();

  if (errInsert) {
    if (esUniqueViolation(errInsert)) {
      throw new CrearSolicitudError("duplicada_hoy");
    }
    throw new CrearSolicitudError("server_error", errInsert.message);
  }

  return {
    solicitud: filaInsertada as ProveedorSolicitud,
    limitadoPorPlan,
  };
}

function esUniqueViolation(err: { code?: string; message?: string }): boolean {
  // Postgres SQLSTATE 23505 = unique_violation.
  return err.code === "23505" || /duplicate key value/i.test(err.message ?? "");
}

function inicioDiaUtcIso(): string {
  const ahora = new Date();
  const inicio = new Date(
    Date.UTC(
      ahora.getUTCFullYear(),
      ahora.getUTCMonth(),
      ahora.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  return inicio.toISOString();
}
