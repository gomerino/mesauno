import { DashboardToaster } from "@/components/dashboard/DashboardToaster";
import { JourneyUnlockBanner } from "@/components/panel/journey/JourneyUnlockBanner";
import { PanelShell } from "@/components/panel/PanelShell";
import { selectEventoForMember } from "@/lib/evento-membership";
import { resolveJourneyPhase } from "@/lib/journey-phases";
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

  const { data: evento } = await selectEventoForMember(
    supabase,
    user.id,
    "id, plan_status, nombre_novio_1, nombre_novio_2, fecha_boda, fecha_evento"
  );
  const eventoId = evento?.id as string | undefined;
  const journeyPhase = resolveJourneyPhase(
    (evento as { fecha_boda?: string | null } | null)?.fecha_boda,
    (evento as { fecha_evento?: string | null } | null)?.fecha_evento
  );

  let showUnlock = false;
  let prefillNombre = "";
  if (eventoId && evento) {
    const planStatus = (evento as { plan_status?: string }).plan_status ?? "trial";
    const { data: isAdmin } = await supabase.rpc("user_is_evento_admin", { p_evento_id: eventoId });
    showUnlock = planStatus !== "paid" && Boolean(isAdmin);
    const n1 = (evento as { nombre_novio_1?: string | null }).nombre_novio_1?.trim() ?? "";
    const n2 = (evento as { nombre_novio_2?: string | null }).nombre_novio_2?.trim() ?? "";
    prefillNombre = [n1, n2].filter(Boolean).join(" & ");
  }

  const unlockBanner =
    showUnlock && eventoId ? (
      <JourneyUnlockBanner
        eventoId={eventoId}
        userEmail={user.email ?? ""}
        prefillNombre={prefillNombre || "Mi evento"}
      />
    ) : null;

  return (
    <>
      <PanelShell userEmail={user.email ?? ""} unlockBanner={unlockBanner} journeyPhase={journeyPhase}>
        {children}
      </PanelShell>
      <DashboardToaster />
    </>
  );
}
