/**
 * Generación de slug único para `proveedores.slug`.
 *
 * Decisión: slug es **inmutable** post-creación. Si el proveedor cambia el
 * nombre del negocio, el slug existente se mantiene (URLs no cambian). Si se
 * quiere soportar rename + redirect, agregar tabla `proveedor_slug_historial`
 * en un ticket futuro.
 */

/** Convierte un string a slug kebab-case ASCII, máx. 60 chars. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Devuelve un slug único llamando a `existe` hasta encontrar uno libre.
 * Si falla tras 99 intentos, agrega sufijo aleatorio para garantizar éxito.
 *
 * Uso típico (server-side):
 *
 * ```ts
 * const slug = await asegurarSlugUnico(
 *   nombreNegocio,
 *   async (s) => {
 *     const { data } = await supabase
 *       .from("proveedores")
 *       .select("id")
 *       .eq("slug", s)
 *       .maybeSingle();
 *     return Boolean(data);
 *   },
 * );
 * ```
 */
export async function asegurarSlugUnico(
  base: string,
  existe: (candidato: string) => Promise<boolean>,
): Promise<string> {
  const raiz = slugify(base);
  if (raiz.length === 0) {
    return `proveedor-${Math.random().toString(36).slice(2, 8)}`;
  }

  if (!(await existe(raiz))) return raiz;

  for (let i = 2; i < 100; i++) {
    const candidato = `${raiz}-${i}`;
    if (!(await existe(candidato))) return candidato;
  }

  return `${raiz}-${Math.random().toString(36).slice(2, 8)}`;
}
