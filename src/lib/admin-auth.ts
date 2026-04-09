import { createClient } from "@/lib/supabase/server";

/** Emails en ADMIN_EMAILS (coma) o ADMIN_EMAIL (uno). Sin definir, no hay admins. */
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email?.trim()) return false;
  const raw = process.env.ADMIN_EMAILS?.trim() || process.env.ADMIN_EMAIL?.trim();
  if (!raw) return false;
  const allowed = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

export async function getAdminSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) return null;
  return user;
}
