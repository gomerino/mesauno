import { InvitacionCronograma } from "@/components/invitacion/InvitacionCronograma";
import { InvitacionMusicaColaborativa } from "@/components/invitacion/InvitacionMusicaColaborativa";
import { createClient, createStrictServiceClient } from "@/lib/supabase/server";
import { BoardingPassCard } from "@/components/BoardingPassCard";
import { InvitacionAcciones } from "@/components/InvitacionAcciones";
import { InvitacionCheckInQr } from "@/components/InvitacionCheckInQr";
import { InvitacionViewTracker } from "@/components/InvitacionViewTracker";
import { MotivoViajeInvitacion } from "@/components/MotivoViajeInvitacion";
import { SiteHeader } from "@/components/SiteHeader";
import { notFound } from "next/navigation";
import {
  boardingPassQrMapUrlMerged,
  fetchEventoForInvitado,
  mergeEventoParaPase,
} from "@/lib/evento-boarding";
import { restriccionesFromDb } from "@/lib/restricciones-alimenticias";
import { resolveEventPlaylistEnv } from "@/lib/event-playlist-env";
import { fetchInvitadoWithAcompanantes } from "@/lib/invitado-fetch";
import { playlistListRecentPublic, spotifyGetCredentials } from "@/lib/spotify-credentials";
import type { EventoProgramaHito, Invitado } from "@/types/database";

type Props = { params: Promise<{ token: string }> };

export default async function InvitacionPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();
  const { data, error } = await fetchInvitadoWithAcompanantes(supabase, token);

  if (error || !data) {
    notFound();
  }

  const invitado = data as Invitado;
  const evento = await fetchEventoForInvitado(supabase, invitado);
  const qrValue = boardingPassQrMapUrlMerged(invitado, evento);
  const merged = mergeEventoParaPase(invitado, evento);
  const motivoViaje = merged.motivo_viaje;
  const fechaEventoPrograma = merged.fecha_evento;
  const playlists = resolveEventPlaylistEnv();

  let programaHitos: EventoProgramaHito[] = [];
  const { data: programaRaw, error: programaErr } = await supabase.rpc("programa_evento_lista_publica", {
    p_token: token,
  });
  if (!programaErr && Array.isArray(programaRaw)) {
    programaHitos = programaRaw as EventoProgramaHito[];
  }
  const trackingToken = invitado.token_acceso ?? invitado.id;

  let musicColabEnabled = false;
  let recentTracks: Awaited<ReturnType<typeof playlistListRecentPublic>> = [];
  if (invitado.evento_id) {
    const db = await createStrictServiceClient();
    if (db) {
      const creds = await spotifyGetCredentials(db, invitado.evento_id);
      musicColabEnabled = Boolean(creds?.refresh_token && creds.playlist_id);
      if (musicColabEnabled) {
        recentTracks = await playlistListRecentPublic(db, invitado.evento_id, 5);
      }
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#d4d4d4] bg-[radial-gradient(ellipse_at_top,_#e8e8e8_0%,_#d4d4d4_55%)]">
      <InvitacionViewTracker accessToken={trackingToken} />
      <SiteHeader compact />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-2 py-3 sm:gap-4 sm:px-4 sm:py-4 lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start lg:gap-8 lg:py-5">
        <div className="mx-auto flex w-full max-w-[20rem] flex-col gap-2 lg:mx-0 lg:sticky lg:top-3">
          <BoardingPassCard invitado={invitado} evento={evento} qrValue={qrValue} playlists={playlists} />
          <InvitacionCheckInQr
            payload={invitado.qr_code_token ?? invitado.id}
            fileName={`check-in-${(invitado.nombre_pasajero || "invitado").slice(0, 24).replace(/\s+/g, "-")}.png`}
          />
          <a
            href={`/api/wallet/generate?id=${encodeURIComponent(invitado.id)}`}
            className="w-full rounded-full bg-[#001d66] py-2 text-center text-xs font-semibold text-white shadow-md hover:bg-[#002a8c] sm:py-2.5 sm:text-sm"
          >
            Añadir a Apple Wallet
          </a>
        </div>

        <div className="min-w-0 lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto lg:pr-1">
          <MotivoViajeInvitacion texto={motivoViaje} />
          <InvitacionCronograma hitos={programaHitos} fechaEvento={fechaEventoPrograma} />
          <InvitacionAcciones
            invitadoId={invitado.id}
            initialRestricciones={restriccionesFromDb(invitado.restricciones_alimenticias)}
            initialEstado={invitado.rsvp_estado}
            compact
          />
          {musicColabEnabled ? (
            <InvitacionMusicaColaborativa invitationAccessToken={token} initialRecent={recentTracks} />
          ) : null}
        </div>
      </main>
    </div>
  );
}
