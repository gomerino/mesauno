"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseProgramaConFotosVentanasPublica, programaFotosPorHitoFromHub } from "@/lib/programa-con-fotos-publica";
import { useRouter } from "next/navigation";
import type { InvitacionThemePageProps } from "../invitacion-theme-props";
import { InvitacionCronograma } from "@/components/invitacion/InvitacionCronograma";
import { InvitacionMusicaColaborativa } from "@/components/invitacion/InvitacionMusicaColaborativa";
import { LiveGallery } from "@/components/invitacion/LiveGallery";
import { PhotoUpload } from "@/components/invitacion/PhotoUpload";
import { InvitacionCheckInQr } from "@/components/InvitacionCheckInQr";
import { formatFechaDDMMMYY, formatFechaEventoLarga } from "@/lib/format-fecha-evento";
import { restriccionesFromDb } from "@/lib/restricciones-alimenticias";
import { normalizeRegalosUrl, TEXTO_REGALOS_DEFAULT } from "@/lib/regalos-invitacion";
import { nombresAcompanantes } from "@/lib/invitado-acompanantes";
import { addressForMapFromPass } from "@/lib/evento-boarding";
import { editorialEventPhase, type EditorialEventPhase } from "@/lib/editorial-event-phase";
import { EditorialDialog } from "./EditorialDialog";
import { EditorialRsvpForm, type EditorialRsvp } from "./EditorialRsvpForm";
import styles from "./editorial.module.css";

export const EDITORIAL_REFERENCE_COVER = "https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&q=85";
export type EditorialPreviewConfig = {
  phase?: EditorialEventPhase;
  showBoardingPass: boolean;
  cover?: { src: string; alt: string };
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
  const [fotos, setFotos] = useState(albumFotos);
  const [groupedPhotos, setGroupedPhotos] = useState(programaFotosPorHito);
  useEffect(() => setGroupedPhotos(programaFotosPorHito), [programaFotosPorHito]);
  const photoIds = fotos.map((foto) => foto.id).sort().join(",");
  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    const refresh = async () => {
      const { data, error } = await createClient().rpc("programa_con_fotos_ventanas_publica", { p_token: token });
      const hub = !error ? parseProgramaConFotosVentanasPublica(data) : null;
      if (!cancelled && hub) setGroupedPhotos(programaFotosPorHitoFromHub(hub));
    };
    void refresh();
    return () => { cancelled = true; };
  }, [demo, token, photoIds]);
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
  useEffect(() => setFotos(albumFotos), [albumFotos]);
  const close = () => setOpen(null);
  const fecha = formatFechaEventoLarga(merged.fecha_evento);
  const dateWithoutWeekday = fecha?.replace(/^[^,]+,?\s(?=\d)/, "") ?? "Fecha por confirmar";
  const dateWithoutYear = fecha?.replace(/ de \d{4}$/, "").replace(",", "") ?? "Fecha por confirmar";
  const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
  const passDate = formatFechaDDMMMYY(merged.fecha_evento, "Fecha por confirmar").replace(/\d{2}$/, merged.fecha_evento?.slice(0, 4) || "");
  const stateLabel = estado === "confirmado" ? "Confirmado" : estado === "declinado" ? "No asistiré" : "Pendiente";
  const rsvpLabel = estado === "pendiente" ? "Confirmar mi asistencia" : "Modificar mi respuesta";
  const location = config.locationLabel || merged.lugar_evento_linea;
  const venue = merged.lugar_evento_linea;
  const address = (merged.direccion_completa || config.locationDetail || addressForMapFromPass(invitado, evento)).trim();
  const names = [evento?.nombre_novio_1, evento?.nombre_novio_2].filter(Boolean);
  const giftUrl = normalizeRegalosUrl(regalos.url_regalos);
  const photoEnabled = config.sections?.fotos !== false && Boolean(invitado.evento_id);
  const photoAction = <PhotoUpload invitacionToken={token} presentation="inline" buttonClassName={styles.primary} onUploaded={(foto) => setFotos((previous) => [foto, ...previous.filter((item) => item.id !== foto.id)])} />;
  const modules: { id: Section; label: string; visible: boolean }[] = [
    { id: "programa", label: "Programa del evento", visible: phase !== "durante" },
    { id: "regalos", label: "Regalos", visible: config.sections?.regalos !== false && regalos.regalos_activos },
    { id: "musica", label: "Nuestra música", visible: config.sections?.musica !== false && Boolean(musicColabEnabled || playlists.spotify || playlists.appleMusic || playlists.other) },
    { id: "dietas", label: "Dietas y preferencias", visible: phase !== "antes" && config.sections?.dietas !== false },
    { id: "fotos", label: phase === "despues" ? "Álbum de recuerdos" : "Ver fotos del evento", visible: false },
  ];
  const saved = (next: EditorialRsvp, diet: string) => { setEstado(next); setRestricciones(diet); if (!demo) router.refresh(); };
  const passenger = [invitado.nombre_pasajero, ...nombresAcompanantes(invitado)].join(" · ");

  return <div className={styles.root} onClickCapture={(event) => {
    // Safari no enfoca botones al tocarlos; el diálogo necesita un disparador al cual devolver el foco.
    const trigger = (event.target as Element).closest<HTMLButtonElement>("button");
    if (trigger && !trigger.closest("dialog")) trigger.focus({ preventScroll: true });
  }}>
    <a href="#editorial-content" className={styles.skip}>Saltar al contenido</a>
    <main className={styles.frame} data-testid="editorial-frame">
      <header className={styles.hero} data-testid="editorial-hero" style={{ backgroundImage: `linear-gradient(0deg,#162d42bf,#162d4233),url(${JSON.stringify(config.cover?.src || EDITORIAL_REFERENCE_COVER)})` }}>
        <div><div className={styles.eyebrow}>{phase === "despues" ? "Nuestros recuerdos" : phase === "durante" ? "Hoy celebramos" : "Nos casamos"}</div><h1>{names.length === 2 ? <>{names[0]}<br /><span className={styles.ampersand}>&amp;</span><br />{names[1]}</> : merged.footerNovios || "Nuestra boda"}</h1><div>{dateWithoutWeekday} · {location}</div>
          <button type="button" className={styles.heroContinue} onClick={() => {
            const content = document.getElementById("editorial-content");
            content?.focus({ preventScroll: true });
            content?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
          }}>{phase === "antes" || !photoEnabled ? "Ver la invitación" : phase === "durante" ? "Ver y compartir fotos" : "Ver los recuerdos"}<span aria-hidden="true">↓</span></button>
        </div>
      </header>
      <div className={styles.content} id="editorial-content" tabIndex={-1}>
        {phase === "antes" && <p className={`${styles.sub} ${styles.center} ${styles.message}`}>{merged.motivo_viaje || "Hay viajes que cambian la vida. Nos encantaría compartir este contigo."}</p>}
        {phase !== "antes" && photoEnabled && <><h2 className={styles.sectionTitle}>{phase === "despues" ? "Álbum de recuerdos" : "Nuestros recuerdos de hoy"}</h2>{phase === "despues" && <p className={styles.sub}>El día pasó volando, pero la alegría de compartirlo con ustedes se queda para siempre. Gracias por cada abrazo, cada sonrisa y por ser parte de nuestra historia. Aquí guardamos esos instantes para volver a vivirlos juntos.</p>}</>}
        <div className={styles.stack}>
          {phase !== "antes" && photoEnabled ? demo ? <button className={styles.primary} onClick={() => setOpen("fotos")}>Compartir fotos</button> : photoAction : <button className={styles.primary} onClick={() => setOpen("rsvp")}>{rsvpLabel}</button>}
        </div>
        {phase !== "antes" && photoEnabled && <section aria-label="Fotos del evento" className={styles.module}>
          {demo ? <div className={styles.galleryEmpty}><p>Aún no hay fotos</p><p className={styles.muted}>Aquí verás los recuerdos compartidos durante el evento.</p></div> : <LiveGallery photoGroups={photoGroups} allowDownload={phase === "despues"} eventoId={invitado.evento_id || ""} fotos={fotos} setFotos={setFotos} emptyHint="Comparte el primer recuerdo con el botón Compartir fotos." />}
        </section>}
        {phase !== "despues" && <>
        <h2 className={styles.sectionTitle}>Lugar y horario</h2>
        <div id="editorial-place" className={styles.info}><div aria-hidden="true">📍</div><div><b>Lugar de la celebración</b><span className={styles.locationLine}>{venue}</span>{address && address !== venue && <span className={styles.locationLine}>{address}</span>}</div></div>
        <div className={styles.info}><div aria-hidden="true">🕒</div><div><b>{capitalize(dateWithoutYear)}</b><span>{merged.hora_embarque.slice(0, 5)} h{config.timeDetail ? ` · ${config.timeDetail}` : ""}</span></div></div>
        {phase === "durante" && <>
          {qrValue && <a className={styles.tile} href={qrValue} target="_blank" rel="noopener noreferrer">Cómo llegar<span aria-hidden="true">↗</span></a>}
          <button className={styles.tile} onClick={() => setOpen("programa")}>Programa del evento<span aria-hidden="true">›</span></button>
        </>}
        {phase !== "durante" && config.showBoardingPass && <><h2 className={styles.sectionTitle}>Tu viaje comienza aquí</h2><div className={styles.ticket}><small>{merged.boarding_linea_aerea || "DREAMS AIRLINES"} · INVITACIÓN</small><h2>Un destino: juntos</h2><div className={styles.ticketgrid}><div><span>PASAJERO</span>{passenger}</div><div><span>ESTADO</span><strong>{stateLabel}</strong></div></div><button className={`${styles.secondary} ${styles.ticketAction}`} onClick={() => setOpen("pase")}>Ver mi pase</button></div></>}
        {phase !== "durante" && <>
        <h2 className={styles.sectionTitle}>Más detalles</h2>
        {modules.filter((module) => module.visible).map((module) => <div key={module.id}><button className={styles.tile} onClick={() => setOpen(module.id)}>{module.label}<span aria-hidden="true">›</span></button>{module.id === "programa" && qrValue && <a className={styles.tile} href={qrValue} target="_blank" rel="noopener noreferrer">Cómo llegar<span aria-hidden="true">›</span></a>}</div>)}
        {phase !== "antes" && <button className={styles.tile} onClick={() => setOpen("rsvp")}>{rsvpLabel}<span aria-hidden="true">›</span></button>}
        </>}
        </>}
      </div>
    </main>
    {open && <EditorialDialog stickyClose={open === "programa"} key={open} title={TITLES[open]} onClose={close}>
      {(open === "rsvp" || open === "dietas") && <EditorialRsvpForm showDietary={phase !== "antes"} invitadoId={invitado.id} nombre={invitado.nombre_pasajero} estado={estado} restricciones={restricciones} dietaryOnly={open === "dietas"} demo={demo} onSaved={saved} onClose={close} />}
      {open === "pase" && <>
        <div className={styles.ticket}><small>{merged.boarding_linea_aerea || "DREAMS AIRLINES"} · BOARDING PASS</small><h2>{names.join(" & ") || merged.footerNovios}</h2><div className={styles.ticketgrid}><div><span>PASAJERO</span>{passenger}</div><div><span>FECHA</span>{passDate}</div><div><span>DESTINO</span>{config.passLocationLabel || location}</div><div><span>ESTADO</span>{stateLabel}</div></div></div>
        {demo ? <p className={styles.muted}>Pase simbólico. No es un código de acceso ni incluye un QR válido.</p> : phase === "durante" && invitado.qr_code_token ? <div className={styles.stack}><InvitacionCheckInQr payload={invitado.qr_code_token} /></div> : <p className={styles.muted}>Tu invitación y los datos de la celebración, siempre a mano.</p>}
        <button className={styles.primary} onClick={() => setOpen("rsvp")}>{estado === "pendiente" ? "Confirmar asistencia" : "Modificar asistencia"}</button><button className={styles.secondary} style={{ marginTop: 10 }} onClick={() => window.print()}>Imprimir pase</button>
      </>}
      {open === "programa" && <div className={styles.module}>{programaHitos.length ? <InvitacionCronograma presentation="editorial" hitos={programaHitos} fechaEvento={merged.fecha_evento} fotosPorHito={groupedPhotos} /> : <p className={styles.sub}>Ceremonia y celebración. Horarios detallados por confirmar.</p>}</div>}
      {open === "regalos" && <><p className={styles.sub} style={{ whiteSpace: "pre-line" }}>{regalos.texto_regalos || TEXTO_REGALOS_DEFAULT}</p>{giftUrl && <a className={styles.primary} href={giftUrl} target="_blank" rel="noopener noreferrer">Abrir lista de regalos</a>}</>}
      {open === "musica" && <div className={styles.module}><div className={styles.stack}>{playlists.spotify && <a className={styles.secondary} href={playlists.spotify} target="_blank" rel="noopener noreferrer">Abrir playlist en Spotify</a>}{playlists.appleMusic && <a className={styles.secondary} href={playlists.appleMusic} target="_blank" rel="noopener noreferrer">Abrir playlist en Apple Music</a>}{playlists.other && <a className={styles.secondary} href={playlists.other} target="_blank" rel="noopener noreferrer">Escuchar nuestra música</a>}</div>{musicColabEnabled && !demo && <InvitacionMusicaColaborativa invitationAccessToken={token} eventoId={invitado.evento_id || ""} invitacionConfirmada={estado === "confirmado"} spotifySyncDisponible={musicColabEnabled} surface="light" />}{demo && <p className={styles.sub}>Las propuestas de canciones están disponibles al abrir una invitación real.</p>}</div>}
      {open === "fotos" && <div className={styles.module}>{demo ? <p className={styles.sub}>Esta es una vista de ejemplo. Abre una invitación real para compartir y ver fotografías del evento.</p> : <><div className={styles.stack}>{photoAction}</div><LiveGallery photoGroups={photoGroups} allowDownload={phase === "despues"} eventoId={invitado.evento_id || ""} fotos={fotos} setFotos={setFotos} emptyHint="Comparte el primer recuerdo con el botón Compartir fotos." /></>}</div>}
      {open !== "rsvp" && open !== "dietas" && open !== "pase" && <div className={styles.stack}><button className={styles.secondary} onClick={close}>Volver a la invitación</button></div>}
    </EditorialDialog>}
  </div>;
}
