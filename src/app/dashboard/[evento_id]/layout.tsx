import { MembresiaTrialBanner } from "@/components/dashboard/MembresiaTrialBanner";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function DashboardEventoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ evento_id: string }>;
}) {
  const { evento_id } = await params;
  if (!UUID_RE.test(evento_id)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/${evento_id}/equipo`)}`);
  }

  const { data: canAccess, error } = await supabase.rpc("user_is_evento_dashboard_member", {
    p_evento_id: evento_id,
  });

  if (error || !canAccess) {
    redirect("/panel");
  }

  const [{ data: eventoRow }, { data: isAdmin }] = await Promise.all([
    supabase.from("eventos").select("plan_status").eq("id", evento_id).maybeSingle(),
    supabase.rpc("user_is_evento_admin", { p_evento_id: evento_id }),
  ]);

  const planStatus = (eventoRow?.plan_status as string | undefined) ?? "trial";
  const showTrialBanner = planStatus !== "paid" && Boolean(isAdmin);

  return (
    <div className="min-h-dvh bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-3xl px-4 pt-4">
        {showTrialBanner ? <MembresiaTrialBanner eventoId={evento_id} /> : null}
      </div>
      <div className="px-4 pb-10">{children}</div>
    </div>
  );
}
