import { isAdminEmail } from "@/lib/admin-auth";
import { DashboardToaster } from "@/components/dashboard/DashboardToaster";
import { PanelShell } from "@/components/panel/PanelShell";
import { selectEventoForMember } from "@/lib/evento-membership";
import { isUserStaffOnly } from "@/lib/membership-roles";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (isAdminEmail(user.email)) {
    redirect("/admin/eventos");
  }

  await supabase.rpc("evento_claim_invite_from_metadata");

  if (await isUserStaffOnly(supabase, user.id)) {
    redirect("/staff/check-in");
  }

  const { data: evento } = await selectEventoForMember(supabase, user.id, "id");
  const equipoHref = evento?.id ? `/dashboard/${evento.id as string}/equipo` : null;

  return (
    <>
      <PanelShell userEmail={user.email ?? ""} equipoHref={equipoHref}>
        {children}
      </PanelShell>
      <DashboardToaster />
    </>
  );
}
