import { isAdminEmail } from "@/lib/admin-auth";
import { isUserStaffOnly } from "@/lib/membership-roles";
import type { SupabaseClient } from "@supabase/supabase-js";

export function safeNextPath(raw: string | null): string {
  const next = raw ?? "/panel";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/panel";
}

/** Después de sesión válida: admin → staff → destino `next` (panel por defecto). Solo servidor (usa ADMIN_EMAILS). */
export async function resolvePostAuthRedirect(
  supabase: SupabaseClient,
  origin: string,
  nextRaw: string | null
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const hint =
      process.env.NODE_ENV === "development"
        ? `&hint=${encodeURIComponent("No hay sesión tras el login. Prueba de nuevo.")}`
        : "";
    return `${origin}/login?error=auth${hint}`;
  }

  if (user.email && isAdminEmail(user.email)) {
    return `${origin}/admin/eventos`;
  }

  if (user.id) {
    await supabase.rpc("evento_claim_invite_from_metadata");
  }

  if (user.id && (await isUserStaffOnly(supabase, user.id))) {
    return `${origin}/staff/check-in`;
  }

  const next = safeNextPath(nextRaw);
  return `${origin}${next}`;
}
