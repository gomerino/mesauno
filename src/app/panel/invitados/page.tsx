import { createClient } from "@/lib/supabase/server";
import { InvitadosManager } from "@/components/InvitadosManager";
import { invitadosDelPanel } from "@/lib/panel-invitados";
import type { Invitado } from "@/types/database";
import Link from "next/link";

export default async function PanelInvitadosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pareja } = await supabase
    .from("parejas")
    .select("id, nombre_novio_1, nombre_novio_2")
    .eq("user_id", user!.id)
    .maybeSingle();

  const { data } = await invitadosDelPanel(
    supabase,
    user!.id,
    pareja?.id ?? null,
    "*, invitado_acompanantes(*)"
  ).order("created_at", { ascending: false });

  const invitados = (data ?? []) as unknown as Invitado[];

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-white">Crear invitados</h1>
      <p className="mt-2 text-slate-400">
        Aquí solo entra cada invitado: nombre, contacto, acompañantes y alimentación. Fecha del evento,
        vuelo, lugar y mensaje del viaje están en{" "}
        <Link href="/panel/pareja-evento" className="text-teal-300 underline hover:text-teal-200">
          Pareja y evento
        </Link>
        .
      </p>
      <p className="mt-2 text-slate-400">
        Puedes crear invitados sin fila en <code className="text-teal-400">parejas</code> (quedan con
        tu usuario); al vincular la pareja, los nuevos pueden asociarse con{" "}
        <code className="text-teal-400">pareja_id</code>.
      </p>
      {!pareja && (
        <p className="mt-3 rounded-lg border border-teal-500/25 bg-teal-500/10 px-4 py-3 text-sm text-teal-100/90">
          Sin pareja en Supabase: los invitados usan{" "}
          <code className="rounded bg-black/30 px-1">owner_user_id</code>. Ejecuta el SQL actualizado
          en <code className="rounded bg-black/30 px-1">supabase/schema.sql</code> (columna + RLS) si
          al guardar ves error de columna o permisos.
        </p>
      )}

      <div className="mt-10">
        <InvitadosManager
          parejaId={pareja?.id ?? null}
          ownerUserId={user!.id}
          initialInvitados={invitados}
        />
      </div>
    </>
  );
}
