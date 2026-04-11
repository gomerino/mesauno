import { InvitacionAlbumSection } from "@/components/invitacion/InvitacionAlbumSection";
import { InvitacionCronograma } from "@/components/invitacion/InvitacionCronograma";
import { InvitacionMusicaColaborativa } from "@/components/invitacion/InvitacionMusicaColaborativa";
import { BoardingPassCard } from "@/components/BoardingPassCard";
import { InvitacionAcciones } from "@/components/InvitacionAcciones";
import { InvitacionCheckInQr } from "@/components/InvitacionCheckInQr";
import { InvitacionViewTracker } from "@/components/InvitacionViewTracker";
import { MotivoViajeInvitacion } from "@/components/MotivoViajeInvitacion";
import { SiteHeader } from "@/components/SiteHeader";
import { restriccionesFromDb } from "@/lib/restricciones-alimenticias";
import type { InvitacionThemePageProps } from "@/components/themes/invitacion-theme-props";

export function LegacyTheme({
  token,
  invitado,
  evento,
  merged,
  qrValue,
  playlists,
  programaHitos,
  albumFotos,
  musicColabEnabled,
  recentTracks,
}: InvitacionThemePageProps) {
  const motivoViaje = merged.motivo_viaje;
  const fechaEventoPrograma = merged.fecha_evento;
  const trackingToken = invitado.token_acceso ?? invitado.id;

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

        <div
          className={
            "min-w-0 lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto lg:pr-1 " +
            (invitado.evento_id ? "pb-24 lg:pb-6" : "")
          }
        >
          <MotivoViajeInvitacion texto={motivoViaje} />
          <InvitacionCronograma hitos={programaHitos} fechaEvento={fechaEventoPrograma} />
          {invitado.evento_id ? (
            <div className="mt-3">
              <InvitacionAlbumSection
                eventoId={invitado.evento_id}
                invitacionToken={token}
                initialFotos={albumFotos}
              />
            </div>
          ) : null}
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
