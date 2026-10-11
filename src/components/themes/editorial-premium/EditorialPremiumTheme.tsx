"use client";

import { Fragment, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseProgramaConFotosVentanasPublica, programaFotosPorHitoFromHub } from "@/lib/programa-con-fotos-publica";
import { useRouter } from "next/navigation";
import type { InvitacionThemePageProps } from "../invitacion-theme-props";
import { InvitacionCronograma } from "@/components/invitacion/InvitacionCronograma";
import { InvitacionMusicaColaborativa } from "@/components/invitacion/InvitacionMusicaColaborativa";
import { CalendarDays, MapPin, Gift, Music2, Heart, Camera, QrCode } from "lucide-react";
import { InvitacionAlbumSection } from "@/components/invitacion/InvitacionAlbumSection";
import { InvitacionCheckInQr } from "@/components/InvitacionCheckInQr";
import { formatFechaDDMMMYY, formatFechaEventoLarga } from "@/lib/format-fecha-evento";
import { restriccionesFromDb } from "@/lib/restricciones-alimenticias";
import { normalizeRegalosUrl, TEXTO_REGALOS_DEFAULT } from "@/lib/regalos-invitacion";
import { nombresAcompanantes } from "@/lib/invitado-acompanantes";
import { editorialEventPhase, type EditorialEventPhase } from "@/lib/editorial-event-phase";
import { EditorialCover, EditorialJourney, EDITORIAL_PARIS_COVER } from "./EditorialCover";
import { EditorialEventDetails } from "./EditorialEventDetails";
import { EditorialCheckIn } from "./EditorialCheckIn";
import { EditorialDialog } from "./EditorialDialog";
import { EditorialRsvpForm, type EditorialRsvp } from "./EditorialRsvpForm";
import styles from "./editorial.module.css";

export const EDITORIAL_REFERENCE_COVER = EDITORIAL_PARIS_COVER;
export type EditorialPreviewConfig = {
  phase?: EditorialEventPhase;
  showBoardingPass: boolean;
  cover?: { src: string; alt: string; positionMobile?: string; positionDesktop?: string };
  locationLabel?: string;
  passLocationLabel?: string;
  locationDetail?: string;
  timeDetail?: string;
  sections?: Partial<Record<"regalos" | "musica" | "dietas" | "fotos", boolean>>;
};
type Section = "rsvp" | "pase" | "programa" | "regalos" | "musica" | "dietas" | "fotos";
const TITLES: Record<Section, string> = { rsvp: "¿Nos acompañas?", pase: "Tu pase de embarque", programa: "Nuestro gran día", regalos: "Regalos", musica: "Nuestra música", dietas: "Preferencias alimentarias", fotos: "Fotos del evento" };

export function EditorialPremiumTheme({ token, invitado, evento, merged, qrValue, programaHitos, programaFotosPorHito, albumFotos, playlists, musicColabEnabled, regalos, config, demo = false }: InvitacionThemePageProps & { config: EditorialPreviewConfig; demo?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState<Section | null>(null);
  const [estado, setEstado] = useState<EditorialRsvp>(invitado.rsvp_estado === "confirmado" || invitado.rsvp_estado === "declinado" ? invitado.rsvp_estado : "pendiente");
  const [restricciones, setRestricciones] = useState(restriccionesFromDb(invitado.restricciones_alimenticias));
  const [albumExpanded, setAlbumExpanded] = useState(false);
  const [fotos, setFotos] = useState(albumFotos.filter(foto => foto.evento_id === invitado.evento_id));
  const [groupedPhotos, setGroupedPhotos] = useState(programaFotosPorHito);
  useEffect(() => setGroupedPhotos(programaFotosPorHito), [programaFotosPorHito]);
  const photoIds = fotos.map((foto) => foto.id).sort().join(",");
  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    const refresh = async () => {
      const { data, error } = await createClient().rpc("programa_con_fotos_ventanas_publica", { p_token: token });
      const hub = !error ? parseProgramaConFotosVentanasPublica(data) : null;
      if (!cancelled && hub && hub.evento_id === invitado.evento_id) setGroupedPhotos(programaFotosPorHitoFromHub(hub));
    };
    void refresh();
    return () => { cancelled = true; };
  }, [demo, token, photoIds, invitado.evento_id]);
  const photoGroups = programaHitos.map((hito) => ({ id: hito.id, title: `${hito.hora.slice(0, 5)} · ${hito.titulo}`, photoIds: (groupedPhotos[hito.id] || []).map((foto) => foto.id) }));
  const [phase, setPhase] = useState<EditorialEventPhase>(config.phase ?? "antes");
  useEffect(() => {
    if (config.phase) { setPhase(config.phase); return; }
    const update = () => setPhase(editorialEventPhase(merged.fecha_evento));
    update();
    const timer = window.setInterval(update, 30_000);
    window.addEventListener("pageshow", update);
    return () => { window.clearInterval(timer); window.removeEventListener("pageshow", update); };
  }, [config.phase, merged.fecha_evento]);
  useEffect(() => setFotos(albumFotos.filter(foto => foto.evento_id === invitado.evento_id)), [albumFotos, invitado.evento_id]);
  const close = () => setOpen(null);
  const fecha = formatFechaEventoLarga(merged.fecha_evento);
  const dateWithoutWeekday = fecha?.replace(/^[^,]+,?\s(?=\d)/, "") ?? "Fecha por confirmar";
  const passDate = formatFechaDDMMMYY(merged.fecha_evento, "Fecha por confirmar").replace(/\d{2}$/, merged.fecha_evento?.slice(0, 4) || "");
  const stateLabel = estado === "confirmado" ? "Confirmado" : estado === "declinado" ? "No asistiré" : "Pendiente";
  const rsvpLabel = estado === "pendiente" ? "Confirmar mi asistencia" : "Modificar mi respuesta";
  const location = config.locationLabel || merged.lugar_evento_linea;
  const venue = merged.lugar_evento_linea;
  const names = [evento?.nombre_novio_1, evento?.nombre_novio_2].filter(Boolean);
  const giftUrl = normalizeRegalosUrl(regalos.url_regalos);
  const photoEnabled = config.sections?.fotos !== false && Boolean(invitado.evento_id);
  const modules: { id: Section; label: string; visible: boolean }[] = [
    { id: "programa", label: "Programa del evento", visible: true },
    { id: "regalos", label: "Regalos", visible: config.sections?.regalos !== false && regalos.regalos_activos },
    { id: "musica", label: "Música", visible: config.sections?.musica !== false && Boolean(musicColabEnabled || playlists.spotify || playlists.appleMusic || playlists.other) },
    { id: "fotos", label: "Fotos del evento", visible: photoEnabled },
  ];
  const icons = { programa: CalendarDays, regalos: Gift, musica: Music2, dietas: Heart, fotos: Camera, pase: QrCode, rsvp: Heart };
  const saved = (next: EditorialRsvp, diet: string) => { setEstado(next); setRestricciones(diet); if (!demo) router.refresh(); };
  const passenger = [invitado.nombre_pasajero, ...nombresAcompanantes(invitado)].join(" · ");

  const photoSection = photoEnabled && <div id="editorial-album" tabIndex={-1}>
    {phase === "antes" && !albumExpanded ? <section className={styles.album}><h2>Nuestros momentos</h2><p>Pronto podremos compartir los recuerdos de este día tan especial.</p></section> : demo ? <section aria-label="Fotos del evento" className={styles.album}><h2>{phase === "antes" ? "Nuestros momentos" : phase === "durante" ? "Compartamos este momento" : "Nuestros recuerdos"}</h2><button className={styles.primary} onClick={() => setOpen("fotos")}>Compartir mis fotos</button><button className={styles.secondary} onClick={() => setOpen("fotos")}>Ver fotos del evento</button><p>Aún no hay fotos</p></section> : <InvitacionAlbumSection presentation="editorial" albumCardClassName={styles.album} eventoId={invitado.evento_id || ""} invitacionToken={token} initialFotos={fotos} fotos={fotos} setFotos={setFotos} allowDownload={phase === "despues"} photoGroups={photoGroups} albumTitle={phase === "antes" ? "Nuestros momentos" : phase === "durante" ? "Compartamos este momento" : "Nuestros recuerdos"} albumBlurb={phase === "antes" ? "Pronto podremos compartir los recuerdos de este día tan especial." : phase === "durante" ? "Comparte tu mirada de este día y disfruta los momentos de todos." : "Gracias por cada abrazo y cada sonrisa. Aquí guardamos esos instantes para volver a vivirlos juntos."} />}
  </div>;
  const showPhotos = () => { setAlbumExpanded(true); requestAnimationFrame(() => { const album = document.getElementById("editorial-album"); album?.focus({ preventScroll: true }); album?.scrollIntoView({ block: "start", behavior: "instant" }); }); };

  return <div className={styles.root} onClickCapture={(event) => {
    // Safari no enfoca botones al tocarlos; el diálogo necesita un disparador al cual devolver el foco.
    const trigger = (event.target as Element).closest<HTMLButtonElement>("button");
    if (trigger && !trigger.closest("dialog")) trigger.focus({ preventScroll: true });
  }}>
    <a href="#editorial-content" className={styles.skip}>Saltar al contenido</a>
    <main className={styles.frame} data-testid="editorial-frame">
      <EditorialCover names={names as string[]} fallbackName={merged.footerNovios || "Nuestra boda"} date={dateWithoutWeekday} location={location} phase={phase} photoEnabled={photoEnabled} cover={config.cover} onSharePhotos={() => { if (demo) setOpen("fotos"); else document.querySelector<HTMLButtonElement>("#editorial-album .editorial-photo-action")?.click(); }} />
      <div id="editorial-content" tabIndex={-1}>
        {phase === "antes" && <EditorialJourney message={merged.motivo_viaje || "Hay viajes que cambian la vida. Nos encantaría compartir este contigo."} />}
      <div className={`${styles.content} ${phase === "antes" ? styles.beforeContent : ""}`}>
        {phase === "antes" && <div className={`${styles.stack} ${styles.rsvpSpacing}`}>
          {estado === "confirmado" ? <section className={styles.rsvpState} aria-label="Estado de asistencia">
            <strong><span aria-hidden="true">✓</span> Asistencia confirmada</strong><p>{passenger}</p>
            <button id="editorial-rsvp-action" type="button" onClick={() => setOpen("rsvp")}>Modificar mi respuesta</button>
          </section> : <><p className={styles.muted}>{estado === "declinado" ? "Has indicado que no podrás asistir." : "Tu respuesta está pendiente."}</p><button id="editorial-rsvp-action" className={styles.primary} onClick={() => setOpen("rsvp")}>{rsvpLabel}</button></>}
        </div>}
        {phase === "durante" && config.showBoardingPass && <EditorialCheckIn payload={demo ? undefined : invitado.qr_code_token || undefined} passengers={[invitado.nombre_pasajero, ...nombresAcompanantes(invitado)]} demo={demo} />}
        {phase !== "antes" && photoSection}
        <EditorialEventDetails date={fecha || "Fecha por confirmar"} passDate={passDate} time={merged.hora_embarque.slice(0, 5)} venue={venue} mapUrl={qrValue || ""} passengers={[invitado.nombre_pasajero, ...nombresAcompanantes(invitado)]} state={estado} airline={merged.boarding_linea_aerea || "DREAMS AIRLINES"} showPass={phase !== "durante" && config.showBoardingPass} />
        {phase !== "despues" && <>
        <h2 className={styles.sectionTitle}>Más detalles</h2>
        <nav className={styles.accessGrid} aria-label="Más detalles">
          {modules.filter(module => module.visible).map(module => { const Icon = icons[module.id]; return <Fragment key={module.id}><button onClick={() => module.id === "fotos" ? showPhotos() : setOpen(module.id)}><Icon aria-hidden="true" /><span>{module.label}</span></button>{module.id === "programa" && qrValue && <a href={qrValue} target="_blank" rel="noopener noreferrer"><MapPin aria-hidden="true" /><span>Cómo llegar</span></a>}</Fragment>; })}
        </nav>
        {phase !== "antes" && <button className={styles.tile} onClick={() => setOpen("rsvp")}>{rsvpLabel}<span aria-hidden="true">›</span></button>}
        </>}
        {phase === "antes" && photoSection}
      </div>
      </div>
    </main>
    {open && <EditorialDialog stickyClose={open === "programa"} key={open} title={TITLES[open]} onClose={close}>
      {(open === "rsvp" || open === "dietas") && <EditorialRsvpForm showDietary={open === "dietas" || phase !== "antes"} invitadoId={invitado.id} nombre={invitado.nombre_pasajero} estado={estado} restricciones={restricciones} dietaryOnly={open === "dietas"} demo={demo} onSaved={saved} onClose={close} />}
      {open === "pase" && <>
        <div className={styles.ticket}><small>{merged.boarding_linea_aerea || "DREAMS AIRLINES"} · BOARDING PASS</small><h2>{names.join(" & ") || merged.footerNovios}</h2><div className={styles.ticketgrid}><div><span>PASAJERO</span>{passenger}</div><div><span>FECHA</span>{passDate}</div><div><span>DESTINO</span>{config.passLocationLabel || location}</div><div><span>ESTADO</span>{stateLabel}</div></div></div>
        {demo ? <p className={styles.muted}>Pase simbólico. No es un código de acceso ni incluye un QR válido.</p> : phase === "durante" && invitado.qr_code_token ? <div className={styles.stack}><InvitacionCheckInQr payload={invitado.qr_code_token} /></div> : <p className={styles.muted}>Tu invitación y los datos de la celebración, siempre a mano.</p>}
        <button className={styles.primary} onClick={() => setOpen("rsvp")}>{estado === "pendiente" ? "Confirmar asistencia" : "Modificar asistencia"}</button><button className={styles.secondary} style={{ marginTop: 10 }} onClick={() => window.print()}>Imprimir pase</button>
      </>}
      {open === "programa" && <div className={styles.module}>{programaHitos.length ? <InvitacionCronograma presentation="editorial" hitos={programaHitos} fechaEvento={merged.fecha_evento} fotosPorHito={groupedPhotos} /> : <p className={styles.sub}>Ceremonia y celebración. Horarios detallados por confirmar.</p>}</div>}
      {open === "regalos" && <><p className={styles.sub} style={{ whiteSpace: "pre-line" }}>{regalos.texto_regalos || TEXTO_REGALOS_DEFAULT}</p>{giftUrl && <a className={styles.primary} href={giftUrl} target="_blank" rel="noopener noreferrer">Abrir lista de regalos</a>}</>}
      {open === "musica" && <div className={styles.module}><div className={styles.stack}>{playlists.spotify && <a className={styles.secondary} href={playlists.spotify} target="_blank" rel="noopener noreferrer">Abrir playlist en Spotify</a>}{playlists.appleMusic && <a className={styles.secondary} href={playlists.appleMusic} target="_blank" rel="noopener noreferrer">Abrir playlist en Apple Music</a>}{playlists.other && <a className={styles.secondary} href={playlists.other} target="_blank" rel="noopener noreferrer">Escuchar nuestra música</a>}</div>{musicColabEnabled && !demo && <InvitacionMusicaColaborativa invitationAccessToken={token} eventoId={invitado.evento_id || ""} invitacionConfirmada={estado === "confirmado"} spotifySyncDisponible={musicColabEnabled} surface="light" />}{demo && <p className={styles.sub}>Las propuestas de canciones están disponibles al abrir una invitación real.</p>}</div>}
      {open === "fotos" && <p className={styles.sub}>Esta es una vista de ejemplo. Abre una invitación real para compartir fotografías.</p>}
      {open !== "rsvp" && open !== "dietas" && open !== "pase" && <div className={styles.stack}><button className={styles.secondary} onClick={close}>Volver a la invitación</button></div>}
    </EditorialDialog>}
  </div>;
}
