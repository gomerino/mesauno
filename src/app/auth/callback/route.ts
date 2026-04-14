import { isAdminEmail } from "@/lib/admin-auth";
import { isUserStaffOnly } from "@/lib/membership-roles";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const VERIFY_OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

async function redirectAfterAuthSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  origin: string,
  nextRaw: string | null
) {
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

  const next = nextRaw ?? "/panel/overview";
  const dest = next.startsWith("/") && !next.startsWith("//") ? next : "/panel/overview";
  return NextResponse.redirect(`${origin}${dest}`);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next");

  const token_hash = searchParams.get("token_hash");
  const otpType = searchParams.get("type");
  if (token_hash && otpType && VERIFY_OTP_TYPES.has(otpType)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: otpType as EmailOtpType,
    });
    if (!error) {
      return redirectAfterAuthSession(supabase, origin, next);
    }
  }

  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectAfterAuthSession(supabase, origin, next);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
