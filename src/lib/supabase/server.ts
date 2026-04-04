import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieRow = { name: string; value: string; options?: CookieOptions };
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieRow[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* Server Component */
          }
        },
      },
    }
  );
}

function resolveServiceRoleKey(): string {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const raw = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (
    !raw ||
    raw === "tu_service_role_key" ||
    raw.startsWith("tu_")
  ) {
    return anon;
  }
  return raw;
}

export async function createServiceClient() {
  const { createClient: createSupabase } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = resolveServiceRoleKey();
  return createSupabase(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
