/** Mensaje legible cuando `error.message` viene vacío (PostgREST / RPC). */
export function supabaseErrorMessage(err: {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
} | null): string {
  if (!err) return "Error desconocido";
  const parts = [err.message, err.details, err.hint, err.code].filter(
    (p): p is string => typeof p === "string" && p.length > 0
  );
  return parts.length > 0 ? parts.join(" — ") : "Error desconocido";
}
