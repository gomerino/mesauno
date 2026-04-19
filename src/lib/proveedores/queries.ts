import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MarketplaceTarjeta,
  Proveedor,
  ProveedorCategoria,
  ProveedorMedio,
  ProveedorServicio,
} from "@/types/database";

/**
 * Consultas server-side del marketplace.
 *
 * Convenciones:
 * - Reciben `SupabaseClient` (vía `createClient()` de `lib/supabase/server`).
 * - Devuelven datos ya filtrados por RLS (aprobados solo).
 * - NO lanzan en ausencia; devuelven `null` o `[]`. Si hay error de red/SQL,
 *   sí lanzan para que el caller decida degradación.
 */

export type FiltrosListado = {
  categoria?: ProveedorCategoria;
  region?: string;
  precio?: "lt-500k" | "500k-1m" | "1m-3m" | "gt-3m";
  orden?: "destacados" | "nuevos" | "precio-asc";
  limit?: number;
  offset?: number;
};

const LIMIT_DEFAULT = 24;

/**
 * Listado principal del marketplace (`/marketplace`).
 * Lee de la vista `v_marketplace_tarjetas` (ya aplica estado=aprobado).
 */
export async function listarTarjetasMarketplace(
  supabase: SupabaseClient,
  filtros: FiltrosListado = {},
): Promise<{ tarjetas: MarketplaceTarjeta[]; total: number }> {
  const limit = filtros.limit ?? LIMIT_DEFAULT;
  const offset = filtros.offset ?? 0;

  let query = supabase
    .from("v_marketplace_tarjetas")
    .select("*", { count: "exact" });

  if (filtros.categoria) {
    query = query.eq("categoria_principal", filtros.categoria);
  }

  if (filtros.region) {
    query = query.eq("region", filtros.region);
  }

  if (filtros.precio) {
    const [min, max] = rangoPrecioBounds(filtros.precio);
    if (min != null) query = query.gte("precio_desde_clp", min);
    if (max != null) query = query.lt("precio_desde_clp", max);
  }

  // Orden:
  //   destacados   → premium primero, luego con más fotos, luego recientes
  //   nuevos       → created_at desc
  //   precio-asc   → precio_desde_clp asc (nulls last), fallback created_at desc
  switch (filtros.orden ?? "destacados") {
    case "nuevos":
      query = query.order("created_at", { ascending: false });
      break;
    case "precio-asc":
      query = query
        .order("precio_desde_clp", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      break;
    case "destacados":
    default:
      query = query
        .order("plan", { ascending: false })
        .order("medios_count", { ascending: false })
        .order("created_at", { ascending: false });
      break;
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    tarjetas: (data ?? []) as MarketplaceTarjeta[],
    total: count ?? 0,
  };
}

function rangoPrecioBounds(
  rango: NonNullable<FiltrosListado["precio"]>,
): [number | null, number | null] {
  switch (rango) {
    case "lt-500k":
      return [null, 500_000];
    case "500k-1m":
      return [500_000, 1_000_000];
    case "1m-3m":
      return [1_000_000, 3_000_000];
    case "gt-3m":
      return [3_000_000, null];
  }
}

/** Detalle completo para `/marketplace/[slug]`. Devuelve null si no existe o no está aprobado. */
export async function obtenerProveedorPorSlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<{
  proveedor: Proveedor;
  servicios: ProveedorServicio[];
  medios: ProveedorMedio[];
} | null> {
  const { data: proveedor, error: errProveedor } = await supabase
    .from("proveedores")
    .select("*")
    .eq("slug", slug)
    .eq("estado", "aprobado")
    .maybeSingle();

  if (errProveedor) throw errProveedor;
  if (!proveedor) return null;

  const [{ data: servicios }, { data: medios }] = await Promise.all([
    supabase
      .from("proveedor_servicios")
      .select("*")
      .eq("proveedor_id", proveedor.id)
      .eq("activo", true)
      .order("orden", { ascending: true }),
    supabase
      .from("proveedor_medios")
      .select("*")
      .eq("proveedor_id", proveedor.id)
      .order("orden", { ascending: true }),
  ]);

  return {
    proveedor: proveedor as Proveedor,
    servicios: (servicios ?? []) as ProveedorServicio[],
    medios: (medios ?? []) as ProveedorMedio[],
  };
}

/**
 * Obtiene el proveedor del user autenticado (para `/provider`).
 * Devuelve null si el user no tiene proveedor creado todavía.
 * Usar con cliente autenticado (RLS `proveedores_select_owner`).
 */
export async function obtenerProveedorPropio(
  supabase: SupabaseClient,
  userId: string,
): Promise<Proveedor | null> {
  const { data, error } = await supabase
    .from("proveedores")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as Proveedor | null;
}

/** Verifica si un slug ya está usado (para onboarding M2). */
export async function slugExiste(
  supabase: SupabaseClient,
  slug: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("proveedores")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
