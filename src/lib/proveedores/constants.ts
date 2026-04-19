import type { ProveedorCategoria } from "@/types/database";

/**
 * Categorías canónicas del marketplace. Orden = orden de chips en UI.
 *
 * Para agregar una categoría: 1) extender `ProveedorCategoria` en
 * `types/database.ts`, 2) agregar acá con label warm, 3) agregar ícono si
 * aplica en UI.
 */
export const PROVEEDOR_CATEGORIAS: ReadonlyArray<{
  value: ProveedorCategoria;
  label: string;
}> = [
  { value: "fotografia", label: "Fotografía" },
  { value: "video", label: "Video" },
  { value: "catering", label: "Catering" },
  { value: "musica", label: "Música" },
  { value: "lugar", label: "Lugar" },
  { value: "decoracion", label: "Decoración" },
  { value: "flores", label: "Flores" },
  { value: "coordinacion", label: "Coordinación" },
] as const;

const LABEL_POR_CATEGORIA = new Map<ProveedorCategoria, string>(
  PROVEEDOR_CATEGORIAS.map((c) => [c.value, c.label]),
);

export function labelCategoria(categoria: ProveedorCategoria): string {
  return LABEL_POR_CATEGORIA.get(categoria) ?? categoria;
}

export function esCategoriaProveedor(input: string): input is ProveedorCategoria {
  return LABEL_POR_CATEGORIA.has(input as ProveedorCategoria);
}

/** Cap de solicitudes/mes para plan free. Premium = sin cap. */
export const CAP_SOLICITUDES_MES_FREE = 3;

/** Cap de fotos para plan free. */
export const CAP_MEDIOS_FREE = 6;

/** Rate limit global por novio (total solicitudes/día, cualquier proveedor). */
export const CAP_SOLICITUDES_DIA_POR_REMITENTE = 5;

/** Regiones soportadas (Chile). Mantener sincronizado con el dropdown UI. */
export const PROVEEDOR_REGIONES: ReadonlyArray<{
  value: string;
  label: string;
}> = [
  { value: "arica-parinacota", label: "Arica y Parinacota" },
  { value: "tarapaca", label: "Tarapacá" },
  { value: "antofagasta", label: "Antofagasta" },
  { value: "atacama", label: "Atacama" },
  { value: "coquimbo", label: "Coquimbo" },
  { value: "valparaiso", label: "Valparaíso" },
  { value: "metropolitana", label: "Región Metropolitana" },
  { value: "ohiggins", label: "O'Higgins" },
  { value: "maule", label: "Maule" },
  { value: "nuble", label: "Ñuble" },
  { value: "biobio", label: "Biobío" },
  { value: "araucania", label: "Araucanía" },
  { value: "los-rios", label: "Los Ríos" },
  { value: "los-lagos", label: "Los Lagos" },
  { value: "aysen", label: "Aysén" },
  { value: "magallanes", label: "Magallanes" },
] as const;

const LABEL_POR_REGION = new Map<string, string>(
  PROVEEDOR_REGIONES.map((r) => [r.value, r.label]),
);

export function labelRegion(region: string): string {
  return LABEL_POR_REGION.get(region) ?? region;
}
