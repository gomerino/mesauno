import { CouplePageHeader } from "@/components/app/CouplePageHeader";
import { EmptyStateCard } from "@/components/app/EmptyStateCard";
import { PanelSubpageChrome } from "@/components/panel/PanelSubpageChrome";
import { createClient } from "@/lib/supabase/server";
import { selectEventoForMember } from "@/lib/evento-membership";
import { BoardingPassCard } from "@/components/BoardingPassCard";
import { InvitadoPicker } from "@/components/panel/InvitadoPicker";
import { boardingPassQrMapUrlMerged } from "@/lib/evento-boarding";
import { resolveEventPlaylistEnv } from "@/lib/event-playlist-env";
import { fetchInvitadosPanelRowsWithAcompanantes } from "@/lib/panel-invitados";
import type { Invitado, Evento } from "@/types/database";

type SearchParams = Promise<{ id?: string }>;

export default async function PanelInvitadosVistaPage({
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
      <PanelSubpageChrome>
        <CouplePageHeader
          eyebrow="Compartir"
          title="Vista previa"
          subtitle="Así verá cada invitado su invitación. Añade al menos una persona en Invitados para previsualizarla."
        />
        <EmptyStateCard
          title="Todavía no hay invitados"
          description="Cuando des de alta a alguien, podrás ver aquí la invitación tal como la recibirá."
          actionHref="/panel/invitados"
          actionLabel="Ir a Invitados"
        />
      </PanelSubpageChrome>
    );
  }

  const defaultId = qId && list.some((i) => i.id === qId) ? qId : list[0]!.id;
  const invitado = list.find((i) => i.id === defaultId) ?? list[0]!;

  const qrValue = boardingPassQrMapUrlMerged(invitado, eventoRow);
  const playlists = resolveEventPlaylistEnv();

  return (
    <PanelSubpageChrome>
      <CouplePageHeader
        eyebrow="Compartir"
        title="Vista previa"
        subtitle="Elige un invitado para ver la invitación tal como la recibirá. Desde el panel puedes enviar correos o compartir el enlace."
      />

      <div className="mt-8">
        <InvitadoPicker
          invitados={list.map((i) => ({ id: i.id, nombre: i.nombre_pasajero }))}
          currentId={defaultId}
        />
      </div>

      <div className="mt-10 flex justify-center">
        <BoardingPassCard invitado={invitado} evento={eventoRow} qrValue={qrValue} playlists={playlists} />
      </div>
    </PanelSubpageChrome>
  );
}
