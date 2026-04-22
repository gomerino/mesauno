import { PanelLayout } from "@/components/panel/ds";
import { PanelPostPaymentSuccess } from "@/components/panel/PanelPostPaymentSuccess";
import { selectEventoForMember } from "@/lib/evento-membership";
import { loadPanelProgressBundle } from "@/lib/panel-progress-load";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Tu viaje despegó — Jurnex",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function pickParam(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

export default async function PanelSuccessPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/panel/success");
  }

  const { data: eventoRaw } = await selectEventoForMember(
    supabase,
    user.id,
    "id, plan, plan_status, monto_pagado, payment_id"
  );
  const evento = eventoRaw as {
    id?: string;
    plan?: string | null;
    plan_status?: string | null;
    monto_pagado?: number | null;
    payment_id?: string | null;
  } | null;

  if (!evento?.id || evento.plan_status !== "paid") {
    redirect("/panel");
  }

  const bundle = await loadPanelProgressBundle(user.id);
  const invitadosCount = bundle.invitados.length;

  const planRaw = evento.plan?.trim();
  const planKind = planRaw === "esencial" ? "esencial" : "experiencia";

  const qp = pickParam(searchParams, "payment_id");
  const paymentId = qp ?? evento.payment_id ?? null;
  const montoPago =
    evento.monto_pagado != null && Number.isFinite(Number(evento.monto_pagado))
      ? Number(evento.monto_pagado)
      : null;

  return (
    <PanelLayout narrow>
      <PanelPostPaymentSuccess
        invitadosCount={invitadosCount}
        planKind={planKind}
        paymentId={paymentId}
        montoPago={montoPago}
      />
    </PanelLayout>
  );
}
