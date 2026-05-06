/**
 * Destino del correo de OTP / magic link (`signInWithOtp` → `emailRedirectTo`).
 * Debe coincidir con una entrada en Supabase → Authentication → Redirect URLs
 * (p. ej. `http://localhost:3000/auth/callback`).
 *
 * Por defecto usa el **origen de la pestaña** (`window.location.origin`) para que en local
 * el enlace vuelva a `http://localhost:3000` aunque `NEXT_PUBLIC_SITE_URL` sea producción.
 *
 * Opcional: `NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN=https://tu-tunnel.ngrok.io` si pruebas auth
 * desde un túnel fijo (sin esto, usa el host actual).
 */
export function getAuthEmailRedirectTo(nextPath: string): string {
  if (typeof window === "undefined") {
    return "";
  }
  const forced = process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN?.trim();
  let origin = window.location.origin;
  if (forced) {
    try {
      origin = new URL(forced.endsWith("/") ? forced.slice(0, -1) : forced).origin;
    } catch {
      // conservar window.location.origin
    }
  }
  const next = encodeURIComponent(nextPath);
  return `${origin.replace(/\/$/, "")}/auth/callback?next=${next}`;
}
