import { createClient } from "@/lib/supabase/server";
import { selectEventoForMember } from "@/lib/evento-membership";
import { BoardingPassCard } from "@/components/BoardingPassCard";
import { InvitadoPicker } from "@/components/panel/InvitadoPicker";
import { boardingPassQrMapUrlMerged } from "@/lib/evento-boarding";
import { resolveEventPlaylistEnv } from "@/lib/event-playlist-env";
import { fetchInvitadosPanelRowsWithAcompanantes } from "@/lib/panel-invitados";
import type { Invitado, Evento } from "@/types/database";

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

  const { data: evento } = await selectEventoForMember(supabase, user!.id, "*");
  const eventoRow = (evento ?? null) as Evento | null;

  const { data: rows } = await fetchInvitadosPanelRowsWithAcompanantes(
    supabase,
    user!.id,
    eventoRow?.id ?? null,
    { orderBy: "nombre_pasajero", ascending: true }
  );

  const list = (rows ?? []) as unknown as Invitado[];

  if (list.length === 0) {
    return (
      <>
        <h1 className="font-display text-3xl font-bold text-white">Vista invitación</h1>
        <p className="mt-4 text-slate-400">No hay invitados todavía. Créalos en «Crear invitados».</p>
      </>
    );
  }

  const defaultId = qId && list.some((i) => i.id === qId) ? qId : list[0]!.id;
  const invitado = list.find((i) => i.id === defaultId) ?? list[0]!;

  const qrValue = boardingPassQrMapUrlMerged(invitado, eventoRow);
  const playlists = resolveEventPlaylistEnv();

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-white">Vista invitación</h1>
      <p className="mt-2 text-slate-400">
        Previsualiza el boarding pass como lo verá el invitado. Elige otro invitado en el selector.
      </p>

      <div className="mt-8">
        <InvitadoPicker
          invitados={list.map((i) => ({ id: i.id, nombre: i.nombre_pasajero }))}
          currentId={defaultId}
        />
      </div>

      <div className="mt-10 flex justify-center">
        <BoardingPassCard invitado={invitado} evento={eventoRow} qrValue={qrValue} playlists={playlists} />
      </div>
    </>
  );
}
