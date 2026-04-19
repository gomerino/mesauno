import type { SupabaseClient } from "@supabase/supabase-js";
import { CAP_MEDIOS_FREE } from "./constants";
import type { ProveedorMedio } from "@/types/database";

/**
 * Gestión de medios (fotos) de un proveedor.
 * Bucket: `proveedor-medios` (creado en migración M01).
 * Path convention: `${proveedor_id}/${uuid}.${ext}`.
 *
 * Convención de portada: la foto con `orden` más bajo es la principal.
 * La view `v_marketplace_tarjetas` ya implementa esta regla.
 */

const MIMES_PERMITIDOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export class SubirMedioError extends Error {
  constructor(
    public readonly code:
      | "sin-proveedor"
      | "cap-plan-free"
      | "mime-invalido"
      | "tamano-excedido"
      | "error-storage"
      | "error-db",
    message: string,
    public readonly detalle?: string,
  ) {
    super(message);
    this.name = "SubirMedioError";
  }
}

export type SubirMedioInput = {
  archivo: File | Blob;
  contentType: string;
  alt?: string | null;
};

export type SubirMedioResult = {
  medio: ProveedorMedio;
};

/**
 * Sube un medio al bucket y crea la row en `proveedor_medios`.
 * Requiere que el user esté autenticado y sea owner del proveedor (RLS valida).
 *
 * @param supabase Cliente SSR autenticado.
 * @param proveedorId Id del proveedor del user.
 * @param plan Plan del proveedor (para aplicar cap CAP_MEDIOS_FREE).
 */
export async function subirMedioProveedor(
  supabase: SupabaseClient,
  params: {
    proveedorId: string;
    plan: "free" | "premium";
    input: SubirMedioInput;
  },
): Promise<SubirMedioResult> {
  const { proveedorId, plan, input } = params;
  const { archivo, contentType } = input;

  if (!MIMES_PERMITIDOS.has(contentType)) {
    throw new SubirMedioError(
      "mime-invalido",
      "Formato no permitido. Usá JPG, PNG o WebP.",
    );
  }

  const size = "size" in archivo ? archivo.size : 0;
  if (size > MAX_BYTES) {
    throw new SubirMedioError(
      "tamano-excedido",
      "La foto supera 10MB. Comprimila antes de subirla.",
    );
  }

  if (plan === "free") {
    const { count, error: cErr } = await supabase
      .from("proveedor_medios")
      .select("id", { count: "exact", head: true })
      .eq("proveedor_id", proveedorId);
    if (cErr) {
      throw new SubirMedioError("error-db", "No pudimos chequear tu plan.", cErr.message);
    }
    if ((count ?? 0) >= CAP_MEDIOS_FREE) {
      throw new SubirMedioError(
        "cap-plan-free",
        `Alcanzaste el máximo de ${CAP_MEDIOS_FREE} fotos del plan free. Upgradeá para subir más.`,
      );
    }
  }

  const ext = mimeToExt(contentType);
  const uuid = crypto.randomUUID();
  const path = `${proveedorId}/${uuid}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("proveedor-medios")
    .upload(path, archivo, {
      contentType,
      upsert: false,
    });

  if (upErr) {
    throw new SubirMedioError("error-storage", "No pudimos subir tu foto.", upErr.message);
  }

  const { data: pub } = supabase.storage
    .from("proveedor-medios")
    .getPublicUrl(path);

  const { data: ordenData } = await supabase
    .from("proveedor_medios")
    .select("orden")
    .eq("proveedor_id", proveedorId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();
  const ordenSiguiente = ((ordenData?.orden as number | undefined) ?? -1) + 1;

  const { data: row, error: insErr } = await supabase
    .from("proveedor_medios")
    .insert({
      proveedor_id: proveedorId,
      tipo: "imagen",
      storage_path: path,
      url_publica: pub.publicUrl,
      alt: input.alt?.trim() || null,
      orden: ordenSiguiente,
    })
    .select("*")
    .single();

  if (insErr || !row) {
    await supabase.storage.from("proveedor-medios").remove([path]).catch(() => {});
    throw new SubirMedioError(
      "error-db",
      "No pudimos guardar la foto.",
      insErr?.message,
    );
  }

  return { medio: row as ProveedorMedio };
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

export async function eliminarMedioProveedor(
  supabase: SupabaseClient,
  medioId: string,
): Promise<void> {
  const { data: medio, error: qErr } = await supabase
    .from("proveedor_medios")
    .select("id, storage_path, proveedor_id")
    .eq("id", medioId)
    .maybeSingle();

  if (qErr) throw qErr;
  if (!medio) {
    throw new SubirMedioError("sin-proveedor", "Foto no encontrada o sin permiso.");
  }

  const path = (medio as { storage_path: string }).storage_path;

  const { error: delErr } = await supabase
    .from("proveedor_medios")
    .delete()
    .eq("id", medioId);
  if (delErr) {
    throw new SubirMedioError("error-db", "No pudimos borrar la foto.", delErr.message);
  }

  await supabase.storage
    .from("proveedor-medios")
    .remove([path])
    .catch(() => {});
}

/**
 * Reordenar fotos. Recibe un array de `{ id, orden }` y actualiza batch.
 * Usado desde el panel (M03) pero lo ponemos acá para reusar en onboarding.
 */
export async function reordenarMediosProveedor(
  supabase: SupabaseClient,
  ordenaciones: ReadonlyArray<{ id: string; orden: number }>,
): Promise<void> {
  for (const { id, orden } of ordenaciones) {
    const { error } = await supabase
      .from("proveedor_medios")
      .update({ orden })
      .eq("id", id);
    if (error) {
      throw new SubirMedioError(
        "error-db",
        "No pudimos guardar el orden.",
        error.message,
      );
    }
  }
}
