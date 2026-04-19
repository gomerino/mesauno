import type { SupabaseClient } from "@supabase/supabase-js";
import { esCategoriaProveedor } from "./constants";
import { obtenerProveedorPropio } from "./queries";
import type { ProveedorCategoria, ProveedorServicio } from "@/types/database";

export type CrearServicioProveedorInput = {
  nombre: string;
  descripcion?: string | null;
  categoria: string;
  precio_desde_clp?: number | null;
  duracion_min?: number | null;
  activo?: boolean;
};

export type ActualizarServicioProveedorInput = Partial<CrearServicioProveedorInput>;

export class ServicioProveedorError extends Error {
  constructor(
    public readonly code:
      | "input-invalido"
      | "categoria-invalida"
      | "no-autorizado"
      | "no-encontrado"
      | "error-db",
    message: string,
    public readonly detalle?: string,
  ) {
    super(message);
    this.name = "ServicioProveedorError";
  }
}

export async function listarServiciosProveedorPropio(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProveedorServicio[]> {
  const prov = await obtenerProveedorPropio(supabase, userId);
  if (!prov) return [];

  const { data, error } = await supabase
    .from("proveedor_servicios")
    .select("*")
    .eq("proveedor_id", prov.id)
    .order("orden", { ascending: true });

  if (error) {
    throw new ServicioProveedorError("error-db", "No se pudieron cargar los servicios.", error.message);
  }
  return (data ?? []) as ProveedorServicio[];
}

export async function crearServicioProveedorPropio(
  supabase: SupabaseClient,
  userId: string,
  input: CrearServicioProveedorInput,
): Promise<ProveedorServicio> {
  const prov = await obtenerProveedorPropio(supabase, userId);
  if (!prov) {
    throw new ServicioProveedorError("no-autorizado", "No tienes un perfil de proveedor.");
  }

  const nombre = input.nombre?.trim() ?? "";
  if (nombre.length < 2) {
    throw new ServicioProveedorError("input-invalido", "Indica un nombre de servicio.");
  }
  if (!esCategoriaProveedor(input.categoria)) {
    throw new ServicioProveedorError("categoria-invalida", "La categoría no es válida.");
  }

  const { count } = await supabase
    .from("proveedor_servicios")
    .select("id", { count: "exact", head: true })
    .eq("proveedor_id", prov.id);

  const orden = count ?? 0;

  const { data, error } = await supabase
    .from("proveedor_servicios")
    .insert({
      proveedor_id: prov.id,
      nombre,
      descripcion: input.descripcion?.trim() || null,
      categoria: input.categoria as ProveedorCategoria,
      precio_desde_clp:
        input.precio_desde_clp != null && !Number.isNaN(Number(input.precio_desde_clp))
          ? Number(input.precio_desde_clp)
          : null,
      duracion_min:
        input.duracion_min != null && input.duracion_min >= 0 ? input.duracion_min : null,
      activo: input.activo !== false,
      orden,
    })
    .select("*")
    .single();

  if (error) {
    throw new ServicioProveedorError("error-db", "No se pudo crear el servicio.", error.message);
  }
  return data as ProveedorServicio;
}

export async function actualizarServicioProveedorPropio(
  supabase: SupabaseClient,
  userId: string,
  servicioId: string,
  input: ActualizarServicioProveedorInput,
): Promise<ProveedorServicio> {
  const prov = await obtenerProveedorPropio(supabase, userId);
  if (!prov) {
    throw new ServicioProveedorError("no-autorizado", "No tienes un perfil de proveedor.");
  }

  const payload: Record<string, unknown> = {};

  if (input.nombre !== undefined) {
    const n = input.nombre.trim();
    if (n.length < 2) {
      throw new ServicioProveedorError("input-invalido", "Indica un nombre de servicio.");
    }
    payload.nombre = n;
  }
  if (input.descripcion !== undefined) {
    payload.descripcion = input.descripcion?.trim() || null;
  }
  if (input.categoria !== undefined) {
    if (!esCategoriaProveedor(input.categoria)) {
      throw new ServicioProveedorError("categoria-invalida", "La categoría no es válida.");
    }
    payload.categoria = input.categoria;
  }
  if (input.precio_desde_clp !== undefined) {
    payload.precio_desde_clp =
      input.precio_desde_clp != null && !Number.isNaN(Number(input.precio_desde_clp))
        ? Number(input.precio_desde_clp)
        : null;
  }
  if (input.duracion_min !== undefined) {
    payload.duracion_min =
      input.duracion_min != null && input.duracion_min >= 0 ? input.duracion_min : null;
  }
  if (input.activo !== undefined) {
    payload.activo = input.activo;
  }

  if (Object.keys(payload).length === 0) {
    throw new ServicioProveedorError("input-invalido", "No hay cambios que aplicar.");
  }

  const { data, error } = await supabase
    .from("proveedor_servicios")
    .update(payload)
    .eq("id", servicioId)
    .eq("proveedor_id", prov.id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new ServicioProveedorError("error-db", "No se pudo actualizar el servicio.", error.message);
  }
  if (!data) {
    throw new ServicioProveedorError("no-encontrado", "No encontramos ese servicio.");
  }
  return data as ProveedorServicio;
}

export async function eliminarServicioProveedorPropio(
  supabase: SupabaseClient,
  userId: string,
  servicioId: string,
): Promise<void> {
  const prov = await obtenerProveedorPropio(supabase, userId);
  if (!prov) {
    throw new ServicioProveedorError("no-autorizado", "No tienes un perfil de proveedor.");
  }

  const { data: borrados, error } = await supabase
    .from("proveedor_servicios")
    .delete()
    .eq("id", servicioId)
    .eq("proveedor_id", prov.id)
    .select("id");

  if (error) {
    throw new ServicioProveedorError("error-db", "No se pudo eliminar el servicio.", error.message);
  }
  if (!borrados?.length) {
    throw new ServicioProveedorError("no-encontrado", "No encontramos ese servicio.");
  }
}
