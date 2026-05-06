"use client";

import { InvitacionCheckInQr } from "@/components/InvitacionCheckInQr";
import { InvitacionCronograma } from "@/components/invitacion/InvitacionCronograma";
import { PhotoUpload } from "@/components/invitacion/PhotoUpload";
import { InvitacionMusicaColaborativa } from "@/components/invitacion/InvitacionMusicaColaborativa";
import { InvitacionViewTracker } from "@/components/InvitacionViewTracker";
import type { InvitacionThemePageProps } from "@/components/themes/invitacion-theme-props";
import {
  AviationInvitacionProvider,
  type AviationInvitacionVariant,
} from "@/components/themes/AviationInvitacionContext";
import { getAviationInviteShellUi } from "@/lib/aviation-invite-shell-ui";
import { SoftAviationFotosClient } from "@/components/themes/soft-aviation/SoftAviationFotosClient";
import { SoftAviationGuestActions } from "@/components/themes/soft-aviation/SoftAviationGuestActions";
import { SoftAviationCheckInFlow } from "@/components/themes/soft-aviation/SoftAviationCheckInFlow";
import { SoftAviationHero } from "@/components/themes/soft-aviation/SoftAviationHero";
import { SoftAviationPostalMotivo } from "@/components/themes/soft-aviation/SoftAviationPostalMotivo";
import { SoftAviationRegalosPanel } from "@/components/themes/soft-aviation/SoftAviationRegalosPanel";
import { SoftAviationTicket } from "@/components/themes/soft-aviation/SoftAviationTicket";
import { formatFechaEventoLarga } from "@/lib/format-fecha-evento";
import { emitInvitacionFotoSubida } from "@/lib/invitacion-foto-upload-client";
import { hasAnyPlaylist } from "@/lib/event-playlist-env";
import { epigrafeDesdeMotivo } from "@/lib/invitacion-epigrafe";
import { restriccionesFromDb } from "@/lib/restricciones-alimenticias";
import { computeSoftAviationInviteFlags } from "@/lib/soft-aviation-invite-state";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, Camera, Gift, Mail, Music2, QrCode, Ticket, Utensils, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export type SoftAviationMainTab = "ticket" | "motivo" | "regalos" | "fotos" | "playlist" | "itinerario" | "dietas";

const NAV: {
  id: SoftAviationMainTab;
  label: string;
  short: string;
  /** Etiqueta corta en la barra inferior móvil (evita recortes y lectura forzada). */
  dockShort: string;
  Icon: LucideIcon;
}[] = [
  { id: "ticket", label: "Pase de abordaje", short: "Pase", dockShort: "Pase", Icon: Ticket },
  { id: "motivo", label: "Carta de invitación", short: "Carta", dockShort: "Carta", Icon: Mail },
  { id: "regalos", label: "Regalos", short: "Regalo", dockShort: "Regalo", Icon: Gift },
  { id: "dietas", label: "Restricciones alimenticias", short: "Dietas", dockShort: "Dietas", Icon: Utensils },
  { id: "fotos", label: "Bitácora de fotos", short: "Fotos", dockShort: "Fotos", Icon: Camera },
  { id: "playlist", label: "Música", short: "Música", dockShort: "Música", Icon: Music2 },
  { id: "itinerario", label: "Itinerario del día", short: "Plan", dockShort: "Plan", Icon: CalendarDays },
];

export function SoftAviationSpaShell({
  token,
  invitado,
  evento,
  merged,
  qrValue,
  playlists,
  programaHitos,
  programaFotosPorHito,
  albumFotos,
  musicColabEnabled,
  aviationVariant = "soft",
}: InvitacionThemePageProps & { aviationVariant?: AviationInvitacionVariant }) {
  const u = getAviationInviteShellUi(aviationVariant);
  const router = useRouter();
  const trackingToken = invitado.token_acceso ?? invitado.id;
  const tituloNovios =
    merged.footerNovios ||
    [evento?.nombre_novio_1, evento?.nombre_novio_2].filter(Boolean).join(" & ") ||
    "Nuestra boda";
  const spotifyUrl = playlists.spotify;
  const appleUrl = playlists.appleMusic;
  const hasPlaylist = hasAnyPlaylist(playlists);

  const [activeTab, setActiveTab] = useState<SoftAviationMainTab>("ticket");
  const [checkInQrOpen, setCheckInQrOpen] = useState(false);
  const [dietaryOpen, setDietaryOpen] = useState(false);
  const [rsvpEstadoLive, setRsvpEstadoLive] = useState<string | null>(invitado.rsvp_estado ?? null);

  const { isConfirmed, isEventDay } = computeSoftAviationInviteFlags(
    rsvpEstadoLive,
    merged.fecha_evento,
    invitado,
    evento
  );

  const hasItinerario = programaHitos.length > 0;

  /**
   * Pase + Carta siempre; Plan si hay hitos (lectura pública, sin depender del RSVP);
   * Dietas/Regalos solo si confirmó asistencia;
   * Música si hay enlace(s) en env o playlist colaborativa en panel (no exige RSVP);
   * Fotos si es día del evento.
   */
  const navItems = useMemo(() => {
    const core = NAV.filter((n) => n.id === "ticket" || n.id === "motivo");
    const planTab = hasItinerario ? NAV.filter((n) => n.id === "itinerario") : [];
    const postConfirm = isConfirmed
      ? NAV.filter((n) => n.id === "dietas" || n.id === "regalos")
      : [];
    const playlistTab =
      hasPlaylist || musicColabEnabled ? NAV.filter((n) => n.id === "playlist") : [];
    const fotosTab = isEventDay ? NAV.filter((n) => n.id === "fotos") : [];
    return [...core, ...planTab, ...postConfirm, ...playlistTab, ...fotosTab];
  }, [isConfirmed, isEventDay, hasItinerario, hasPlaylist, musicColabEnabled]);

  const navColumnCount = navItems.length + (isEventDay ? 1 : 0);

  useEffect(() => {
    setRsvpEstadoLive(invitado.rsvp_estado ?? null);
  }, [invitado.rsvp_estado]);

  useEffect(() => {
    const allowed = new Set(navItems.map((n) => n.id));
    if (!allowed.has(activeTab)) setActiveTab("ticket");
  }, [navItems, activeTab]);

  const motivoText = merged.motivo_viaje?.trim() ?? "";
  const epigrafeHero = epigrafeDesdeMotivo(merged.motivo_viaje, 140);
  const eventoId = invitado.evento_id ?? null;
  const fechaLegible = formatFechaEventoLarga(merged.fecha_evento);

  const checkInPayload = (invitado.qr_code_token ?? invitado.id).trim();
  const checkInFileName = `check-in-${(invitado.nombre_pasajero || "invitado").slice(0, 24).replace(/\s+/g, "-")}.png`;
  const sectionFrame = "animate-fadeIn mx-auto w-full max-w-[20rem] min-w-0 py-2 sm:py-4";
  const sectionFrameLoose = `${sectionFrame} px-0`;

  const handleNavClick = (id: SoftAviationMainTab) => {
    if (id === "dietas") {
      setDietaryOpen(true);
      return;
    }
    setActiveTab(id);
  };

  /** Más aire en móvil por barra inferior + CTA RSVP + FAB de fotos. */
  const photoFabBottomExtra = useMemo(() => "10.5rem", []);

  useEffect(() => {
    if (!checkInQrOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCheckInQrOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [checkInQrOpen]);

  const qrModal =
    checkInQrOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-aviation-qr-9400 flex animate-fadeIn items-end justify-center p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkin-qr-title"
          >
            <button
              type="button"
              className={u.modalBackdrop}
              aria-label="Cerrar"
              onClick={() => setCheckInQrOpen(false)}
            />
            <div className={u.modalPanel}>
              <div className={u.modalHeader}>
                <h2 id="checkin-qr-title" className={u.modalTitle}>
                  Ingreso
                </h2>
                <button
                  type="button"
                  onClick={() => setCheckInQrOpen(false)}
                  className={u.modalClose}
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[min(78dvh,32rem)] overflow-y-auto overscroll-contain p-3 sm:p-4">
                <p className={u.modalHint}>Presenta este código al ingreso</p>
                <div className={u.modalQrBox}>
                  <InvitacionCheckInQr payload={checkInPayload} fileName={checkInFileName} />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <AviationInvitacionProvider value={aviationVariant}>
    <div className={u.pageRoot}>
      <InvitacionViewTracker accessToken={trackingToken} />
      {activeTab === "itinerario" && isEventDay && eventoId && token.trim() ? (
        <PhotoUpload
          invitacionToken={token}
          fabBottomExtra={photoFabBottomExtra}
          onUploaded={(foto) => {
            emitInvitacionFotoSubida(foto);
            router.refresh();
          }}
        />
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
        {/* Desktop/tablet: rail izquierdo. Móvil: oculto (navegación abajo, más ancho útil y pulgar). */}
        <aside className={u.aside}>
          <nav
            className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-1 py-2 [-webkit-overflow-scrolling:touch]"
            aria-label="Secciones de la invitación"
          >
            {navItems.map(({ id, label, short, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  onClick={() => handleNavClick(id)}
                  className={`relative flex w-full flex-col items-center gap-0.5 rounded-lg py-2 transition ${
                    active ? u.navBtnActive : u.navBtn
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-full ${active ? u.navBar : "bg-transparent"}`}
                    aria-hidden
                  />
                  <Icon
                    className={`h-[1.05rem] w-[1.05rem] shrink-0 sm:h-5 sm:w-5 ${active ? u.navIconActive : ""}`}
                    strokeWidth={active ? 2.5 : 1.75}
                    aria-hidden
                  />
                  <span className="max-w-full whitespace-normal break-words px-0.5 text-center text-[8px] font-semibold leading-[1.2] tracking-tight min-[400px]:text-[9px] md:text-[10px]">
                    {short}
                  </span>
                </button>
              );
            })}
          </nav>

          {isEventDay ? (
            <div className={u.asideQrTop}>
              <button
                type="button"
                title="Código QR de ingreso"
                aria-label="Mostrar código QR para ingreso"
                onClick={() => setCheckInQrOpen(true)}
                className={u.qrAsideBtn}
              >
                <QrCode className="h-[1.05rem] w-[1.05rem] shrink-0 sm:h-5 sm:w-5" strokeWidth={2} aria-hidden />
                <span className="max-w-[3rem] text-center text-[6px] font-semibold leading-[1.05] sm:text-[7px]">QR</span>
              </button>
            </div>
          ) : null}
        </aside>

        <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden">
          <SoftAviationHero
            tituloNovios={tituloNovios}
            fechaEvento={merged.fecha_evento}
            horaEmbarque={merged.hora_embarque}
            fechaLegible={fechaLegible}
            portadaFotos={albumFotos}
            compact={false}
            epigrafe={epigrafeHero}
          />

          <div className="mx-auto min-h-0 min-w-0 w-full max-w-[20rem] flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-y-auto px-2 pb-[max(8.5rem,env(safe-area-inset-bottom))] pt-0.5 min-[400px]:max-w-[22rem] md:max-w-[38rem] lg:max-w-[42rem] max-md:pb-[max(7rem,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch]">
        {activeTab === "ticket" ? (
          <div key="ticket" className={`${sectionFrame} flex min-h-full min-w-0 flex-col items-center justify-center`}>
            <SoftAviationTicket
              invitado={invitado}
              evento={evento}
              merged={merged}
              mapUrl={qrValue}
              programaHitos={programaHitos}
              isEventDay={isEventDay}
              actionSlot={
                <SoftAviationGuestActions
                  invitadoId={invitado.id}
                  invitado={invitado}
                  evento={evento}
                  initialEstado={rsvpEstadoLive ?? invitado.rsvp_estado}
                  restriccionesRaw={invitado.restricciones_alimenticias}
                  spotifyPlaylistUrl={spotifyUrl}
                  footerMode="embedded"
                  onRsvpEstadoChange={setRsvpEstadoLive}
                />
              }
            />
          </div>
        ) : null}

        {activeTab === "motivo" ? (
          <SoftAviationPostalMotivo key="motivo" motivoText={motivoText} />
        ) : null}

        {activeTab === "regalos" ? <SoftAviationRegalosPanel key="regalos" /> : null}

        {activeTab === "fotos" ? (
          <div key="fotos" className={sectionFrameLoose}>
            {eventoId ? (
              <SoftAviationFotosClient
                eventoId={eventoId}
                invitacionToken={token}
                initialFotos={albumFotos}
                photoFabBottomExtra={photoFabBottomExtra}
                hideOuterSection
                albumCardClassName={u.albumCard}
                albumTitle="Bitácora compartida"
                albumBlurb="Sube y revisa fotos del evento 📸"
              />
            ) : (
              <div className={u.albumEmpty}>
                La bitácora estará disponible cuando el evento tenga álbum activo.
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "playlist" ? (
          <div key="playlist" className={sectionFrameLoose}>
            <p className={u.playlistIntro}>
              Escucha la playlist del evento y suma canciones para la fiesta.
            </p>
            <div className="mx-auto flex w-full min-w-0 max-w-full flex-col gap-8">
              {hasPlaylist ? (
                <section className="w-full" aria-labelledby="playlist-escuchar-heading">
                  <h2
                    id="playlist-escuchar-heading"
                    className={u.escucharHeading}
                  >
                    Escuchar
                  </h2>
                  <div className="flex flex-col items-stretch gap-4">
                    {appleUrl ? (
                      <Link
                        href={appleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={u.appleCard}
                      >
                        <span
                          className={u.appleIcon}
                          aria-hidden
                        >
                          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                          </svg>
                        </span>
                        <div>
                          <p className={u.appleMusicLabel}>Apple Music</p>
                          <p className="mt-1 font-inviteSerif text-lg font-semibold text-white">Abrir playlist</p>
                          <p className="mt-1 text-xs text-white/70">Escucha la banda sonora del gran día</p>
                        </div>
                      </Link>
                    ) : null}

                    {spotifyUrl ? (
                      <Link
                        href={spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={u.spotifyLink}
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-spotify-brand text-white">
                          <Music2 className="h-4 w-4" aria-hidden />
                        </span>
                        Abrir playlist en Spotify
                      </Link>
                    ) : null}

                    {playlists.other ? (
                      <Link
                        href={playlists.other}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={u.otherLink}
                      >
                        Abrir enlace de música
                      </Link>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {musicColabEnabled ? (
                <section
                  className={`w-full ${hasPlaylist ? u.colabSectionBorder : ""}`}
                  aria-labelledby="playlist-colab-heading"
                >
                  <h2
                    id="playlist-colab-heading"
                    className={u.colabHeading}
                  >
                    Proponer y apoyar
                  </h2>
                  <InvitacionMusicaColaborativa
                    invitationAccessToken={token}
                    eventoId={eventoId ?? ""}
                    invitacionConfirmada={isConfirmed}
                    spotifySyncDisponible={musicColabEnabled}
                    surface="light"
                  />
                </section>
              ) : hasPlaylist ? (
                <p className={u.colabNote}>
                  Las sugerencias y votos en vivo se activan cuando quien organiza conecta Spotify en el panel del
                  evento.
                </p>
              ) : (
                <p className={u.colabEmpty}>
                  Pronto publicaremos el enlace a la playlist y las canciones colaborativas.
                </p>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "itinerario" ? (
          <div key="itinerario" className={sectionFrameLoose}>
            <p className={u.itinIntro}>Revisa cómo llegar y horarios</p>
            {hasItinerario ? (
              <div className={u.itinBox}>
                <InvitacionCronograma
                  hitos={programaHitos}
                  fechaEvento={merged.fecha_evento}
                  fotosPorHito={programaFotosPorHito}
                />
              </div>
            ) : (
              <div className={u.itinEmpty}>
                El plan del día se publicará aquí cuando esté listo.
              </div>
            )}
          </div>
        ) : null}
          </div>

          {/* Móvil: barra fija inferior — alcance del pulgar, contenido a ancho completo sin rail lateral. */}
          <nav
            className={u.mobileNav}
            style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
            aria-label="Secciones de la invitación"
          >
            <div
              className="grid w-full gap-0.5 px-0.5 py-1"
              style={{ gridTemplateColumns: `repeat(${navColumnCount}, minmax(0, 1fr))` }}
            >
              {navItems.map(({ id, label, dockShort, Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    title={label}
                    aria-label={label}
                    aria-current={active ? "page" : undefined}
                    onClick={() => handleNavClick(id)}
                    className={`flex min-h-[3.25rem] min-w-0 flex-col items-center justify-center rounded-xl py-1 touch-manipulation transition active:scale-[0.97] ${
                      active ? u.mobileNavBtnActive : u.mobileNavBtn
                    }`}
                  >
                    <Icon
                      className={`h-[1.15rem] w-[1.15rem] shrink-0 sm:h-5 sm:w-5 ${active ? u.navIconActive : ""}`}
                      strokeWidth={active ? 2.5 : 1.75}
                      aria-hidden
                    />
                    <span className="mt-0.5 max-w-[100%] truncate px-0.5 text-center text-[9px] font-semibold leading-[1.1] tracking-tight min-[400px]:text-[10px]">
                      {dockShort}
                    </span>
                  </button>
                );
              })}
              {isEventDay ? (
                <button
                  type="button"
                  title="Código QR de ingreso"
                  aria-label="Mostrar código QR para ingreso"
                  onClick={() => setCheckInQrOpen(true)}
                  className={u.mobileQrBtn}
                >
                  <QrCode className="h-[1.15rem] w-[1.15rem] shrink-0 sm:h-5 sm:w-5" strokeWidth={2} aria-hidden />
                  <span className="mt-0.5 max-w-[100%] truncate text-center text-[9px] font-semibold leading-[1.1] min-[400px]:text-[10px]">QR</span>
                </button>
              ) : null}
            </div>
          </nav>
        </div>
      </div>

      {qrModal}
      {dietaryOpen ? (
        <SoftAviationCheckInFlow
          invitadoId={invitado.id}
          initialEstado={rsvpEstadoLive ?? invitado.rsvp_estado}
          initialRestricciones={restriccionesFromDb(invitado.restricciones_alimenticias)}
          fechaEvento={merged.fecha_evento}
          planKind={evento?.plan ?? null}
          spotifyPlaylistUrl={spotifyUrl}
          flowMode="details"
          onClose={() => setDietaryOpen(false)}
          onRsvpSaved={setRsvpEstadoLive}
        />
      ) : null}
    </div>
    </AviationInvitacionProvider>
  );
}
