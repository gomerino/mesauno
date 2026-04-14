import { StaffAppShell, type StaffEventoOption } from "@/components/staff/StaffAppShell";
import { fetchStaffEventoIds } from "@/lib/staff-eventos";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/staff/check-in");
  }

  const eventoIds = await fetchStaffEventoIds(supabase, user.id);
  if (eventoIds.length === 0) {
    redirect("/panel/overview");
  }

  const { data: eventos } = await supabase
    .from("eventos")
    .select("id, nombre_evento, nombre_novio_1, nombre_novio_2")
    .in("id", eventoIds);

  return (
    <Suspense fallback={<div className="min-h-dvh bg-slate-950" />}>
      <StaffAppShell
        eventoIds={eventoIds}
        eventos={(eventos ?? []) as StaffEventoOption[]}
        userEmail={user.email ?? ""}
      >
        {children}
      </StaffAppShell>
    </Suspense>
  );
}
