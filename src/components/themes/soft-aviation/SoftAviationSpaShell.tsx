"use client";

import { InvitacionCheckInQr } from "@/components/InvitacionCheckInQr";
import { InvitacionCronograma } from "@/components/invitacion/InvitacionCronograma";
import { PhotoUpload } from "@/components/invitacion/PhotoUpload";
import { InvitacionMusicaColaborativa } from "@/components/invitacion/InvitacionMusicaColaborativa";
import { InvitacionViewTracker } from "@/components/InvitacionViewTracker";
import type { InvitacionThemePageProps } from "@/components/themes/invitacion-theme-props";
import { SoftAviationFotosClient } from "@/components/themes/soft-aviation/SoftAviationFotosClient";
import { SoftAviationGuestActions } from "@/components/themes/soft-aviation/SoftAviationGuestActions";
import { SoftAviationHero } from "@/components/themes/soft-aviation/SoftAviationHero";
import { SoftAviationPostalMotivo } from "@/components/themes/soft-aviation/SoftAviationPostalMotivo";
import { SoftAviationRegalosPanel } from "@/components/themes/soft-aviation/SoftAviationRegalosPanel";
import { SoftAviationTicket } from "@/components/themes/soft-aviation/SoftAviationTicket";
import { formatFechaEventoLarga } from "@/lib/format-fecha-evento";
import { emitInvitacionFotoSubida } from "@/lib/invitacion-foto-upload-client";
import { hasAnyPlaylist } from "@/lib/event-playlist-env";
import { computeSoftAviationInviteFlags } from "@/lib/soft-aviation-invite-state";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, Camera, Gift, Mail, Music2, QrCode, Ticket, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export type SoftAviationMainTab = "ticket" | "motivo" | "regalos" | "fotos" | "playlist" | "itinerario";

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
  recentTracks,
  topTracks,
  apoyoTrackUris,
}: InvitacionThemePageProps) {
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
   * Regalos/Música si confirmó; Fotos si es día del evento.
   */
  const navItems = useMemo(() => {
    const core = NAV.filter((n) => n.id === "ticket" || n.id === "motivo");
    const planTab = hasItinerario ? NAV.filter((n) => n.id === "itinerario") : [];
    const postConfirm = isConfirmed
      ? NAV.filter((n) => n.id === "regalos" || n.id === "playlist")
      : [];
    const fotosTab = isEventDay ? NAV.filter((n) => n.id === "fotos") : [];
    return [...core, ...planTab, ...postConfirm, ...fotosTab];
  }, [isConfirmed, isEventDay, hasItinerario]);

  const navColumnCount = navItems.length + (isEventDay ? 1 : 0);

  useEffect(() => {
    setRsvpEstadoLive(invitado.rsvp_estado ?? null);
  }, [invitado.rsvp_estado]);

  useEffect(() => {
    const allowed = new Set(navItems.map((n) => n.id));
    if (!allowed.has(activeTab)) setActiveTab("ticket");
  }, [navItems, activeTab]);

  const motivoText = merged.motivo_viaje?.trim() ?? "";
  const eventoId = invitado.evento_id ?? null;
  const fechaLegible = formatFechaEventoLarga(merged.fecha_evento);

  const checkInPayload = (invitado.qr_code_token ?? invitado.id).trim();
  const checkInFileName = `check-in-${(invitado.nombre_pasajero || "invitado").slice(0, 24).replace(/\s+/g, "-")}.png`;

  /** Más aire en móvil por barra inferior + CTA RSVP + FAB de fotos. */
  const photoFabBottomExtra = useMemo(() => "10.5rem", []);

  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

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
            className="fixed inset-0 z-[9400] flex animate-fadeIn items-end justify-center p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkin-qr-title"
          >
            <button
              type="button"
              className="absolute inset-0 bg-[#1A2B48]/45 backdrop-blur-[2px]"
              aria-label="Cerrar"
              onClick={() => setCheckInQrOpen(false)}
            />
            <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-[#1A2B48]/12 bg-[#F4F1EA] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#1A2B48]/10 bg-white/90 px-3 py-2.5">
                <h2 id="checkin-qr-title" className="font-inviteSerif text-base font-semibold text-[#1A2B48]">
                  Ingreso
                </h2>
                <button
                  type="button"
                  onClick={() => setCheckInQrOpen(false)}
                  className="rounded-full p-2 text-[#1A2B48]/50 transition hover:bg-[#1A2B48]/5 hover:text-[#1A2B48]"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[min(78dvh,32rem)] overflow-y-auto overscroll-contain p-3 sm:p-4">
                <p className="mb-2 text-center text-xs text-[#1A2B48]/60">Presenta este código al ingreso</p>
                <div className="rounded-xl border border-[#1A2B48]/10 bg-white">
                  <InvitacionCheckInQr payload={checkInPayload} fileName={checkInFileName} />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#F4F1EA] font-inviteBody text-[#1A2B48] antialiased [color-scheme:light]">
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-row">
        {/* Desktop/tablet: rail izquierdo. Móvil: oculto (navegación abajo, más ancho útil y pulgar). */}
        <aside className="hidden w-[4.75rem] shrink-0 flex-col border-r border-[#1A2B48]/10 bg-white/95 shadow-[2px_0_12px_rgba(26,43,72,0.04)] backdrop-blur-md supports-[backdrop-filter]:bg-white/88 md:flex">
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
                  onClick={() => setActiveTab(id)}
                  className={`relative flex w-full flex-col items-center gap-0.5 rounded-lg py-2 transition ${
                    active
                      ? "bg-[#D4AF37]/22 text-[#1A2B48] shadow-sm ring-1 ring-[#D4AF37]/35"
                      : "text-[#1A2B48]/50 hover:bg-[#1A2B48]/5 hover:text-[#1A2B48]/85"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-full ${active ? "bg-[#D4AF37]" : "bg-transparent"}`}
                    aria-hidden
                  />
                  <Icon
                    className={`h-[1.05rem] w-[1.05rem] shrink-0 sm:h-5 sm:w-5 ${active ? "text-[#1A2B48]" : ""}`}
                    strokeWidth={active ? 2.5 : 1.75}
                    aria-hidden
                  />
                  <span className="max-w-full whitespace-normal break-words px-0.5 text-center text-[6px] font-semibold leading-[1.15] tracking-tight sm:text-[6.5px]">
                    {short}
                  </span>
                </button>
              );
            })}
          </nav>

          {isEventDay ? (
            <div className="shrink-0 border-t border-[#1A2B48]/10 px-1 py-2">
              <button
                type="button"
                title="Código QR de ingreso"
                aria-label="Mostrar código QR para ingreso"
                onClick={() => setCheckInQrOpen(true)}
                className="flex w-full flex-col items-center gap-0.5 rounded-lg py-2 text-[#1A2B48]/70 transition hover:bg-[#D4AF37]/15 hover:text-[#1A2B48]"
              >
                <QrCode className="h-[1.05rem] w-[1.05rem] shrink-0 sm:h-5 sm:w-5" strokeWidth={2} aria-hidden />
                <span className="max-w-[3rem] text-center text-[5px] font-semibold leading-[1.05] sm:text-[6px]">QR</span>
              </button>
            </div>
          ) : null}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <SoftAviationHero
            tituloNovios={tituloNovios}
            fechaEvento={merged.fecha_evento}
            horaEmbarque={merged.hora_embarque}
            fechaLegible={fechaLegible}
            portadaFotos={albumFotos}
            compact={activeTab === "ticket"}
          />

          <div className="mx-auto min-h-0 w-full max-w-lg flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(8.5rem,env(safe-area-inset-bottom))] pt-0.5 max-md:pb-[max(10rem,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch]">
        {activeTab === "ticket" ? (
          <div key="ticket" className="flex min-h-full flex-col items-center justify-center px-1 py-1 sm:py-2">
            <SoftAviationTicket
              invitado={invitado}
              evento={evento}
              merged={merged}
              mapUrl={qrValue}
              programaHitos={programaHitos}
              isEventDay={isEventDay}
            />
          </div>
        ) : null}

        {activeTab === "motivo" ? (
          <SoftAviationPostalMotivo key="motivo" motivoText={motivoText} />
        ) : null}

        {activeTab === "regalos" ? <SoftAviationRegalosPanel key="regalos" /> : null}

        {activeTab === "fotos" ? (
          <div key="fotos" className="animate-fadeIn px-1 py-4">
            {eventoId ? (
              <SoftAviationFotosClient
                eventoId={eventoId}
                invitacionToken={token}
                initialFotos={albumFotos}
                photoFabBottomExtra={photoFabBottomExtra}
                hideOuterSection
                albumCardClassName="rounded-2xl border border-[#1A2B48]/10 bg-white p-4 shadow-sm [&_h2]:font-inviteSerif [&_h2]:text-[#1A2B48] [&_p]:text-[#1A2B48]/70"
                albumTitle="Bitácora compartida"
                albumBlurb="Sube y revisa fotos del evento 📸"
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-[#1A2B48]/15 bg-white/80 p-8 text-center text-sm text-[#1A2B48]/60">
                La bitácora estará disponible cuando el evento tenga álbum activo.
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "playlist" ? (
          <div key="playlist" className="animate-fadeIn w-full px-1 py-4">
            <p className="mb-5 text-center text-xs leading-relaxed text-[#1A2B48]/70">
              Escucha la playlist del evento y suma canciones para la fiesta.
            </p>
            <div className="mx-auto flex w-full max-w-md flex-col gap-8">
              {hasPlaylist ? (
                <section className="w-full" aria-labelledby="playlist-escuchar-heading">
                  <h2
                    id="playlist-escuchar-heading"
                    className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-[#1A2B48]/45"
                  >
                    Escuchar
                  </h2>
                  <div className="flex flex-col items-stretch gap-4">
                    {appleUrl ? (
                      <Link
                        href={appleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-[#D4AF37] bg-[#1A2B48] px-6 py-6 text-center shadow-md transition hover:brightness-110"
                      >
                        <span
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/20 text-white ring-2 ring-[#D4AF37]/50"
                          aria-hidden
                        >
                          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">Apple Music</p>
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
                        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#1A2B48]/15 bg-white px-5 py-3 text-sm font-semibold text-[#1A2B48] shadow-sm transition hover:border-[#D4AF37]/60 hover:bg-[#FFF9F0]"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1DB954] text-white">
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
                        className="text-center text-sm font-medium text-[#1A2B48] underline decoration-[#D4AF37] decoration-2 underline-offset-4 hover:text-[#D4AF37]"
                      >
                        Abrir enlace de música
                      </Link>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {musicColabEnabled ? (
                <section
                  className={`w-full ${hasPlaylist ? "border-t border-[#1A2B48]/10 pt-2" : ""}`}
                  aria-labelledby="playlist-colab-heading"
                >
                  <h2
                    id="playlist-colab-heading"
                    className="mb-1 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-[#1A2B48]/45"
                  >
                    Proponer y apoyar
                  </h2>
                  <InvitacionMusicaColaborativa
                    invitationAccessToken={token}
                    initialRecent={recentTracks}
                    initialTop={topTracks}
                    apoyoTrackUris={apoyoTrackUris}
                    surface="light"
                  />
                </section>
              ) : hasPlaylist ? (
                <p className="border-t border-[#1A2B48]/10 pt-6 text-center text-xs text-[#1A2B48]/55">
                  Las sugerencias y votos en vivo se activan cuando quien organiza conecta Spotify en el panel del
                  evento.
                </p>
              ) : (
                <p className="text-center text-sm text-[#1A2B48]/55">
                  Pronto publicaremos el enlace a la playlist y las canciones colaborativas.
                </p>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "itinerario" ? (
          <div key="itinerario" className="animate-fadeIn px-1 py-4">
            <p className="mb-2 text-center text-xs text-[#1A2B48]/65">Revisa cómo llegar y horarios</p>
            {hasItinerario ? (
              <div className="rounded-2xl border border-[#1A2B48]/10 bg-white p-3 shadow-sm sm:p-4 [&_.font-display]:font-inviteSerif">
                <InvitacionCronograma
                  hitos={programaHitos}
                  fechaEvento={merged.fecha_evento}
                  fotosPorHito={programaFotosPorHito}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#1A2B48]/15 bg-white/80 p-8 text-center text-sm text-[#1A2B48]/60">
                El plan del día se publicará aquí cuando esté listo.
              </div>
            )}
          </div>
        ) : null}
          </div>

          <div
            className={
              isEventDay && isConfirmed
                ? "contents"
                : "shrink-0 border-t border-[#1A2B48]/8 bg-[#F4F1EA]/95 px-2 pt-2 pb-2 shadow-[0_-4px_20px_rgba(26,43,72,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-[#F4F1EA]/88 md:pb-[max(0.35rem,env(safe-area-inset-bottom,0px))]"
            }
          >
            <SoftAviationGuestActions
              invitadoId={invitado.id}
              invitado={invitado}
              evento={evento}
              initialEstado={rsvpEstadoLive ?? invitado.rsvp_estado}
              restriccionesRaw={invitado.restricciones_alimenticias}
              spotifyPlaylistUrl={spotifyUrl}
              footerMode="embedded"
              isEventDay={isEventDay}
              onRsvpEstadoChange={setRsvpEstadoLive}
            />
          </div>

          {/* Móvil: barra fija inferior — alcance del pulgar, contenido a ancho completo sin rail lateral. */}
          <nav
            className="shrink-0 border-t border-[#1A2B48]/12 bg-white/98 shadow-[0_-8px_28px_rgba(26,43,72,0.1)] md:hidden"
            style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
            aria-label="Secciones de la invitación"
          >
            {!isConfirmed ? (
              <p className="px-2 pt-1.5 text-center text-[9px] leading-tight text-[#1A2B48]/55">Confirma tu asistencia ✈️</p>
            ) : null}
            <div
              className="grid w-full gap-0.5 px-0.5 pt-1"
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
                    onClick={() => setActiveTab(id)}
                    className={`flex min-h-[3.25rem] min-w-0 flex-col items-center justify-center rounded-xl py-1 touch-manipulation transition active:scale-[0.97] ${
                      active
                        ? "bg-[#D4AF37]/22 text-[#1A2B48] ring-1 ring-[#D4AF37]/35"
                        : "text-[#1A2B48]/50 active:bg-[#1A2B48]/5"
                    }`}
                  >
                    <Icon
                      className={`h-[1.15rem] w-[1.15rem] shrink-0 sm:h-5 sm:w-5 ${active ? "text-[#1A2B48]" : ""}`}
                      strokeWidth={active ? 2.5 : 1.75}
                      aria-hidden
                    />
                    <span className="mt-0.5 max-w-[100%] truncate px-0.5 text-center text-[8px] font-semibold leading-[1.1] tracking-tight">
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
                  className="flex min-h-[3.25rem] min-w-0 flex-col items-center justify-center rounded-xl py-1 text-[#1A2B48]/70 touch-manipulation transition active:scale-[0.97] active:bg-[#D4AF37]/18"
                >
                  <QrCode className="h-[1.15rem] w-[1.15rem] shrink-0 sm:h-5 sm:w-5" strokeWidth={2} aria-hidden />
                  <span className="mt-0.5 max-w-[100%] truncate text-center text-[8px] font-semibold leading-[1.1]">QR</span>
                </button>
              ) : null}
            </div>
          </nav>
        </div>
      </div>

      {qrModal}
    </div>
  );
}
