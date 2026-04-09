import { StaffCheckInClient } from "@/components/staff/StaffCheckInClient";
import { fetchStaffEventoIds, resolveStaffEventoId } from "@/lib/staff-eventos";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StaffCheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ evento?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ids = await fetchStaffEventoIds(supabase, user.id);
  const sp = await searchParams;
  const eventoId = resolveStaffEventoId(ids, sp.evento);
  if (!eventoId) return null;

  return <StaffCheckInClient eventoId={eventoId} />;
}
