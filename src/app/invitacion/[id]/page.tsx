import { createClient } from "@/lib/supabase/server";
import { BoardingPassCard } from "@/components/BoardingPassCard";
import { InvitacionAcciones } from "@/components/InvitacionAcciones";
import { MotivoViajeInvitacion } from "@/components/MotivoViajeInvitacion";
import { SiteHeader } from "@/components/SiteHeader";
import { notFound } from "next/navigation";
import {
  boardingPassQrMapUrlMerged,
  fetchParejaForInvitado,
  mergeEventoParaPase,
} from "@/lib/pareja-evento";
import { restriccionesFromDb } from "@/lib/restricciones-alimenticias";
import { resolveEventPlaylistEnv } from "@/lib/event-playlist-env";
import type { Invitado } from "@/types/database";

type Props = { params: Promise<{ id: string }> };

export default async function InvitacionPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitados")
    .select("*, invitado_acompanantes(*)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const invitado = data as Invitado;
  const pareja = await fetchParejaForInvitado(supabase, invitado);
  const qrValue = boardingPassQrMapUrlMerged(invitado, pareja);
  const motivoViaje = mergeEventoParaPase(invitado, pareja).motivo_viaje;
  const playlists = resolveEventPlaylistEnv();

  return (
    <div className="flex min-h-dvh flex-col bg-[#d4d4d4] bg-[radial-gradient(ellipse_at_top,_#e8e8e8_0%,_#d4d4d4_55%)]">
      <SiteHeader compact />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-2 py-3 sm:gap-4 sm:px-4 sm:py-4 lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start lg:gap-8 lg:py-5">
        <div className="mx-auto flex w-full max-w-[20rem] flex-col gap-2 lg:mx-0 lg:sticky lg:top-3">
          <BoardingPassCard invitado={invitado} pareja={pareja} qrValue={qrValue} playlists={playlists} />
          <a
            href={`/api/wallet/generate?id=${encodeURIComponent(id)}`}
            className="w-full rounded-full bg-[#001d66] py-2 text-center text-xs font-semibold text-white shadow-md hover:bg-[#002a8c] sm:py-2.5 sm:text-sm"
          >
            Añadir a Apple Wallet
          </a>
        </div>

        <div className="min-w-0 lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto lg:pr-1">
          <MotivoViajeInvitacion texto={motivoViaje} />
          <InvitacionAcciones
            invitadoId={id}
            initialRestricciones={restriccionesFromDb(invitado.restricciones_alimenticias)}
            initialEstado={invitado.rsvp_estado}
            compact
          />
        </div>
      </main>
    </div>
  );
}
