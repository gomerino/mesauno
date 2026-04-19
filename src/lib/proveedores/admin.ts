import type { SupabaseClient } from "@supabase/supabase-js";
import type { Proveedor, ProveedorEstado } from "@/types/database";

/**
 * Operaciones de admin sobre proveedores (M02).
 * El caller DEBE validar previamente `isAdminEmail(user.email)` — estas
 * funciones no validan autorización.
 *
 * Usar con cliente de service role (`createStrictServiceClient`) para bypass RLS.
 */

export type MotivoSuspension =
  | "incompleto"
  | "baja-calidad"
  | "duplicado"
  | "otro";

export const MOTIVOS_SUSPENSION: ReadonlyArray<{
  value: MotivoSuspension;
  label: string;
  descripcion: string;
}> = [
  {
    value: "incompleto",
    label: "Perfil incompleto",
    descripcion: "Faltan fotos, bio o contacto.",
  },
  {
    value: "baja-calidad",
    label: "Baja calidad",
    descripcion: "Fotos borrosas, copy pobre o poco profesional.",
  },
  {
    value: "duplicado",
    label: "Duplicado",
    descripcion: "Ya existe un perfil similar del mismo negocio.",
  },
  {
    value: "otro",
    label: "Otro motivo",
    descripcion: "Ver detalle manual.",
  },
] as const;

export function esMotivoSuspension(input: string): input is MotivoSuspension {
  return MOTIVOS_SUSPENSION.some((m) => m.value === input);
}

export type AdminProveedorListaItem = Proveedor & {
  auth_email: string | null;
  medios_count: number;
};

export async function listarProveedoresAdmin(
  admin: SupabaseClient,
  params: { estado?: ProveedorEstado; limit?: number } = {},
): Promise<AdminProveedorListaItem[]> {
  const { estado = "pendiente", limit = 50 } = params;

  const { data, error } = await admin
    .from("proveedores")
    .select("*")
    .eq("estado", estado)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  const rows = (data ?? []) as Proveedor[];
  if (rows.length === 0) return [];

  // Enriquecer con count de medios. (Consulta agregada batch).
  const ids = rows.map((r) => r.id);
  const { data: mediosRaw } = await admin
    .from("proveedor_medios")
    .select("proveedor_id")
    .in("proveedor_id", ids);

  const conteo = new Map<string, number>();
  for (const m of (mediosRaw ?? []) as Array<{ proveedor_id: string }>) {
    conteo.set(m.proveedor_id, (conteo.get(m.proveedor_id) ?? 0) + 1);
  }

  return rows.map((r) => ({
    ...r,
    auth_email: r.email,
    medios_count: conteo.get(r.id) ?? 0,
  }));
}

export async function aprobarProveedor(
  admin: SupabaseClient,
  proveedorId: string,
): Promise<Proveedor> {
  const { data, error } = await admin
    .from("proveedores")
    .update({
      estado: "aprobado" as ProveedorEstado,
      motivo_suspension: null,
    })
    .eq("id", proveedorId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("Proveedor no encontrado.");
  }
  return data as Proveedor;
}

export async function suspenderProveedor(
  admin: SupabaseClient,
  proveedorId: string,
  motivo: MotivoSuspension,
  detalle?: string | null,
): Promise<Proveedor> {
  const motivoGuardado = detalle?.trim()
    ? `${motivo}:${detalle.trim().slice(0, 280)}`
    : motivo;

  const { data, error } = await admin
    .from("proveedores")
    .update({
      estado: "suspendido" as ProveedorEstado,
      motivo_suspension: motivoGuardado,
    })
    .eq("id", proveedorId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("Proveedor no encontrado.");
  }
  return data as Proveedor;
}

/** Decodifica el motivo almacenado `motivo:detalle` en `{ motivo, detalle }`. */
export function parseMotivoSuspension(stored: string | null): {
  motivo: MotivoSuspension | null;
  detalle: string | null;
} {
  if (!stored) return { motivo: null, detalle: null };
  const [motivo, ...rest] = stored.split(":");
  const m = motivo?.trim() ?? "";
  return {
    motivo: esMotivoSuspension(m) ? m : null,
    detalle: rest.length > 0 ? rest.join(":").trim() : null,
  };
}
