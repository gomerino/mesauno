import { createClient } from "@/lib/supabase/server";
import { BoardingPassCard } from "@/components/BoardingPassCard";
import { InvitadoPicker } from "@/components/panel/InvitadoPicker";
import { boardingPassQrMapUrlMerged } from "@/lib/pareja-evento";
import { resolveEventPlaylistEnv } from "@/lib/event-playlist-env";
import { invitadosDelPanel } from "@/lib/panel-invitados";
import type { Invitado, Pareja } from "@/types/database";

type SearchParams = Promise<{ id?: string }>;

export default async function VistaInvitacionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { id: qId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pareja } = await supabase.from("parejas").select("*").eq("user_id", user!.id).maybeSingle();
  const parejaRow = (pareja ?? null) as Pareja | null;

  const { data: rows } = await invitadosDelPanel(
    supabase,
    user!.id,
    parejaRow?.id ?? null,
    "*, invitado_acompanantes(*)"
  ).order("nombre_pasajero");

  const list = (rows ?? []) as unknown as Invitado[];

  if (list.length === 0) {
    return (
      <>
        <h1 className="font-display text-3xl font-bold text-white">Ver invitación</h1>
        <p className="mt-6 text-slate-400">
          Aún no hay invitados.{" "}
          <a href="/panel/invitados" className="text-teal-300 underline hover:text-teal-200">
            Crea invitados aquí
          </a>
          .
        </p>
      </>
    );
  }

  const validId = qId && list.some((i) => i.id === qId) ? qId : list[0]!.id;
  const invitado = list.find((i) => i.id === validId)!;
  const qrValue = boardingPassQrMapUrlMerged(invitado, parejaRow);

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-white">Ver invitación</h1>
      <p className="mt-2 text-slate-400">
        Previsualiza el boarding pass tal como lo verá el invitado (fondo gris de la página real no
        se muestra aquí).
      </p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-[#e8e8e8] p-6">
        <InvitadoPicker
          invitados={list.map((i) => ({ id: i.id, nombre: i.nombre_pasajero }))}
          currentId={validId}
        />
        <div className="mt-8">
          <BoardingPassCard
            invitado={invitado}
            pareja={parejaRow}
            qrValue={qrValue}
            playlists={resolveEventPlaylistEnv()}
          />
        </div>
      </div>
    </>
  );
}
