import { isAdminEmail } from "@/lib/admin-auth";
import { isUserStaffOnly } from "@/lib/membership-roles";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/panel";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email && isAdminEmail(user.email)) {
        return NextResponse.redirect(`${origin}/admin/eventos`);
      }

      if (user?.id) {
        await supabase.rpc("evento_claim_invite_from_metadata");
      }

      if (user?.id && (await isUserStaffOnly(supabase, user.id))) {
        return NextResponse.redirect(`${origin}/staff/check-in`);
      }

      const dest = next.startsWith("/") ? next : "/panel";
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
