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

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-white">Crear invitados</h1>
      <p className="mt-2 text-slate-400">
        Aquí solo entra cada invitado: nombre, contacto, asiento en el pase, acompañantes y alimentación. Fecha del
        evento, vuelo, lugar y mensaje del viaje están en{" "}
        <Link href="/panel/evento" className="text-teal-300 underline hover:text-teal-200">
          Evento
        </Link>
        .
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Puedes crear invitados sin fila en <code className="text-teal-400">eventos</code> (quedan con tu usuario); al
        vincular el evento, los nuevos pueden asociarse con <code className="text-teal-400">evento_id</code>.
      </p>
      {!evento && (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Sin evento en Supabase: los invitados usan <code className="text-amber-200">owner_user_id</code> hasta que
          crees el evento y tu membresía.
        </p>
      )}
      {invitadosError && (
        <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          No se pudieron cargar los invitados: {invitadosError.message}
        </p>
      )}
      <div className="mt-10">
        <InvitadosManager eventoId={evento?.id ?? null} initialInvitados={invitados} />
      </div>
    </>
  );
}
