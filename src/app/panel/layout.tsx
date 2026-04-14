import { MembresiaTrialBanner } from "@/components/dashboard/MembresiaTrialBanner";
import { DashboardToaster } from "@/components/dashboard/DashboardToaster";
import { PanelShell } from "@/components/panel/PanelShell";
import { selectEventoForMember } from "@/lib/evento-membership";
import { isAdminEmail } from "@/lib/admin-auth";
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

  const { data: evento } = await selectEventoForMember(supabase, user.id, "id, plan_status");
  const eventoId = evento?.id as string | undefined;

  let showTrialBanner = false;
  if (eventoId && evento) {
    const planStatus = (evento as { plan_status?: string }).plan_status ?? "trial";
    const { data: isAdmin } = await supabase.rpc("user_is_evento_admin", { p_evento_id: eventoId });
    showTrialBanner = planStatus !== "paid" && Boolean(isAdmin);
  }

  return (
    <>
      <PanelShell userEmail={user.email ?? ""}>
        {showTrialBanner && eventoId ? (
          <div className="mb-2 hidden md:block">
            <MembresiaTrialBanner eventoId={eventoId} />
          </div>
        ) : null}
        {children}
        {showTrialBanner && eventoId ? (
          <div className="mt-8 md:hidden">
            <MembresiaTrialBanner eventoId={eventoId} compact />
          </div>
        ) : null}
      </PanelShell>
      <DashboardToaster />
    </>
  );
}
