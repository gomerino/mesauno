/** URL pública del objeto en el bucket `fotos_eventos` (sin slash inicial en `storagePath`). */
export function eventoFotoPublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const path = storagePath.replace(/^\//, "");
  return `${base}/storage/v1/object/public/fotos_eventos/${path}`;
}
