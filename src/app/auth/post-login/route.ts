import { resolvePostAuthRedirect } from "@/lib/auth-post-login-redirect";
import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Tras login en cliente; resuelve admin/staff/next con cookies de sesión ya presentes. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const nextRaw = url.searchParams.get("next");
  const supabase = await createClient();
  const dest = await resolvePostAuthRedirect(supabase, origin, nextRaw);
  return NextResponse.redirect(dest);
}
