import type { SupabaseClient } from "@supabase/supabase-js";
import { esCategoriaProveedor } from "./constants";
import type { Proveedor, ProveedorCategoria } from "@/types/database";

/**
 * Update parcial del proveedor del user autenticado.
 * Usa el cliente SSR (no admin). RLS `proveedores_update_owner` permite solo
 * al owner editar su propia row. Campos sensibles (`estado`, `plan`, `motivo_suspension`,
 * `solicitudes_mes`, `slug`) NO son editables desde acá.
 */

export type ActualizarProveedorInput = Partial<{
  nombre_negocio: string;
  eslogan: string | null;
  biografia: string | null;
  region: string;
  ciudad: string | null;
  categoria_principal: string;
  telefono: string | null;
  email: string | null;
  sitio_web: string | null;
  instagram: string | null;
  whatsapp: string | null;
}>;

const CAMPOS_PERMITIDOS: ReadonlyArray<keyof ActualizarProveedorInput> = [
  "nombre_negocio",
  "eslogan",
  "biografia",
  "region",
  "ciudad",
  "categoria_principal",
  "telefono",
  "email",
  "sitio_web",
  "instagram",
  "whatsapp",
];

export class ActualizarProveedorError extends Error {
  constructor(
    public readonly code:
      | "input-invalido"
      | "categoria-invalida"
      | "sin-cambios"
      | "no-autorizado"
      | "error-db",
    message: string,
    public readonly detalle?: string,
  ) {
    super(message);
    this.name = "ActualizarProveedorError";
  }
}

export async function actualizarProveedorPropio(
  supabase: SupabaseClient,
  userId: string,
  input: ActualizarProveedorInput,
): Promise<Proveedor> {
  const payload: Record<string, unknown> = {};

  for (const campo of CAMPOS_PERMITIDOS) {
    if (!(campo in input)) continue;
    const raw = input[campo];
    if (campo === "categoria_principal" && typeof raw === "string") {
      if (!esCategoriaProveedor(raw)) {
        throw new ActualizarProveedorError(
          "categoria-invalida",
          "La categoría seleccionada no está soportada.",
        );
      }
      payload[campo] = raw as ProveedorCategoria;
      continue;
    }
    if (typeof raw === "string") {
      const t = raw.trim();
      payload[campo] = t.length === 0 ? null : t;
    } else if (raw === null) {
      payload[campo] = null;
    }
  }

  if (Object.keys(payload).length === 0) {
    throw new ActualizarProveedorError("sin-cambios", "No hay cambios que aplicar.");
  }

  const { data, error } = await supabase
    .from("proveedores")
    .update(payload)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new ActualizarProveedorError(
      "error-db",
      "No pudimos guardar los cambios.",
      error.message,
    );
  }
  if (!data) {
    throw new ActualizarProveedorError(
      "no-autorizado",
      "No encontramos tu perfil o no tienes permiso para editarlo.",
    );
  }
  return data as Proveedor;
}
