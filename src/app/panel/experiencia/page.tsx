import { ExperienciaPageClient } from "@/components/panel/experiencia/ExperienciaPageClient";
import { selectEventoForMember } from "@/lib/evento-membership";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ExperienciaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: evento } = await selectEventoForMember(supabase, user.id, "plan_status");
  const isPaid = (evento as { plan_status?: string } | null)?.plan_status === "paid";

  return <ExperienciaPageClient isPaid={isPaid} />;
}
