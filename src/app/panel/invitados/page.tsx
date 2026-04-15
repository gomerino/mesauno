import { CouplePageHeader } from "@/components/app/CouplePageHeader";
import { GrowthNudge } from "@/components/app/GrowthNudge";
import { PanelSubpageChrome } from "@/components/panel/PanelSubpageChrome";
import { createClient } from "@/lib/supabase/server";
import { selectEventoForMember } from "@/lib/evento-membership";
import { InvitadosManager } from "@/components/InvitadosManager";
import { fetchInvitadosPanelRowsWithAcompanantes } from "@/lib/panel-invitados";
import type { Invitado } from "@/types/database";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PanelInvitadosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: evento } = await selectEventoForMember(
    supabase,
    user!.id,
    "id, nombre_novio_1, nombre_novio_2"
  );

  const { data, error: invitadosError } = await fetchInvitadosPanelRowsWithAcompanantes(
    supabase,
    user!.id,
    evento?.id ?? null,
    { orderBy: "created_at", ascending: false }
  );
  if (invitadosError) {
    console.error("[panel/invitados] fetch invitados:", invitadosError.message);
  }

  const invitados = (data ?? []) as unknown as Invitado[];
  const hasInvitados = invitados.length > 0;

  return (
    <PanelSubpageChrome>
      <CouplePageHeader
        eyebrow="Invitados"
        title="¿A quién invitamos?"
        subtitle={
          <span className="text-slate-400">
            Una lista clara para tu gran día. Los datos del evento están en{" "}
            <Link href="/panel/evento" className="text-teal-300 underline hover:text-teal-200">
              Evento
            </Link>
            .
          </span>
        }
      />

      {evento && !hasInvitados && (
        <div className="mt-4 md:hidden">
          <a
            href="#agregar-invitados"
            className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-teal-500 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-950/30 hover:bg-teal-400"
          >
            Agregar invitados
          </a>
        </div>
      )}

      {!evento && (
        <div className="mt-6">
          <GrowthNudge
            message="Aún no creaste la ficha del evento. Cuando la completes, los invitados quedarán asociados automáticamente."
            href="/panel/evento"
            ctaLabel="Crear ficha del evento"
          />
        </div>
      )}

      {evento && !hasInvitados && (
        <div
          className="mt-6 rounded-xl border border-teal-500/30 bg-teal-500/[0.12] px-4 py-3 text-sm text-teal-50"
          role="status"
        >
          <strong className="font-medium text-white">Te falta un paso:</strong> añadí al menos una persona abajo para
          generar su invitación y compartirla.
        </div>
      )}

      {invitadosError && (
        <p className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          No pudimos cargar la lista. Intenta recargar la página. Si el problema continúa, contacta soporte.
        </p>
      )}

      <div id="agregar-invitados" className="mt-10 scroll-mt-28">
        <InvitadosManager eventoId={evento?.id ?? null} initialInvitados={invitados} />
      </div>
    </PanelSubpageChrome>
  );
}
