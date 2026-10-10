"use client";

import { useEffect, useState } from "react";
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
type Section = "rsvp" | "pase" | "programa" | "ubicacion" | "regalos" | "musica" | "dietas" | "fotos";
const TITLES: Record<Section, string> = { rsvp: "¿Nos acompañas?", pase: "Tu pase de embarque", programa: "Programa del evento", ubicacion: "Cómo llegar", regalos: "Regalos", musica: "Nuestra música", dietas: "Preferencias alimentarias", fotos: "Fotos del evento" };

export function EditorialPremiumTheme({ token, invitado, evento, merged, qrValue, programaHitos, programaFotosPorHito, albumFotos, playlists, musicColabEnabled, regalos, config, demo = false }: InvitacionThemePageProps & { config: EditorialPreviewConfig; demo?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState<Section | null>(null);
  const [estado, setEstado] = useState<EditorialRsvp>(invitado.rsvp_estado === "confirmado" || invitado.rsvp_estado === "declinado" ? invitado.rsvp_estado : "pendiente");
  const [restricciones, setRestricciones] = useState(restriccionesFromDb(invitado.restricciones_alimenticias));
  const [fotos, setFotos] = useState(albumFotos);
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
  const names = [evento?.nombre_novio_1, evento?.nombre_novio_2].filter(Boolean);
  const giftUrl = normalizeRegalosUrl(regalos.url_regalos);
  const photoEnabled = config.sections?.fotos !== false && Boolean(invitado.evento_id);
  const photoAction = <PhotoUpload invitacionToken={token} presentation="inline" buttonClassName={styles.primary} onUploaded={(foto) => setFotos((previous) => [foto, ...previous.filter((item) => item.id !== foto.id)])} />;
  const modules: { id: Section; label: string; visible: boolean }[] = [
    { id: "programa", label: "Programa del evento", visible: true },
    { id: "ubicacion", label: "Cómo llegar", visible: true },
    { id: "regalos", label: "Regalos", visible: config.sections?.regalos !== false && regalos.regalos_activos },
    { id: "musica", label: "Nuestra música", visible: config.sections?.musica !== false && Boolean(musicColabEnabled || playlists.spotify || playlists.appleMusic || playlists.other) },
    { id: "dietas", label: "Dietas y preferencias", visible: config.sections?.dietas !== false },
    { id: "fotos", label: phase === "despues" ? "Álbum de recuerdos" : "Ver fotos del evento", visible: photoEnabled && phase !== "antes" },
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
        <div><div className={styles.eyebrow}>{phase === "despues" ? "Nuestros recuerdos" : phase === "durante" ? "Hoy celebramos" : "Nos casamos"}</div><h1>{names.length === 2 ? <>{names[0]}<br />&amp; {names[1]}</> : merged.footerNovios || "Nuestra boda"}</h1><div>{dateWithoutWeekday} · {location}</div></div>
      </header>
      <div className={styles.content} id="editorial-content">
        <p className={`${styles.sub} ${styles.center}`}>{merged.motivo_viaje || "Hay viajes que cambian la vida. Nos encantaría compartir este contigo."}</p>
        <div className={styles.stack}>
          {phase === "durante" && photoEnabled ? demo ? <button className={styles.primary} onClick={() => setOpen("fotos")}>Compartir fotos</button> : photoAction : phase === "despues" && photoEnabled ? <button className={styles.primary} onClick={() => setOpen("fotos")}>Ver álbum de recuerdos</button> : <button className={styles.primary} onClick={() => setOpen("rsvp")}>{rsvpLabel}</button>}
          {phase === "durante" && photoEnabled ? <button className={styles.secondary} onClick={() => setOpen("fotos")}>Ver fotos del evento</button> : <button className={styles.secondary} onClick={() => document.getElementById("editorial-place")?.scrollIntoView({ block: "center", behavior: "auto" })}>Ver lugar y horario</button>}
        </div>
        <div id="editorial-place" className={styles.info}><div aria-hidden="true">📍</div><div><b>Lugar de la celebración</b><span>{config.locationDetail || merged.direccion_completa || merged.lugar_evento_linea}</span></div></div>
        <div className={styles.info}><div aria-hidden="true">🕒</div><div><b>{capitalize(dateWithoutYear)}</b><span>{merged.hora_embarque.slice(0, 5)} h{config.timeDetail ? ` · ${config.timeDetail}` : ""}</span></div></div>
        {config.showBoardingPass && <><h2 className={styles.sectionTitle}>Tu viaje comienza aquí</h2><div className={styles.ticket}><small>{merged.boarding_linea_aerea || "DREAMS AIRLINES"} · INVITACIÓN</small><h2>Un destino: juntos</h2><div className={styles.ticketgrid}><div><span>PASAJERO</span>{passenger}</div><div><span>ESTADO</span><strong>{stateLabel}</strong></div></div><button className={`${styles.secondary} ${styles.ticketAction}`} onClick={() => setOpen("pase")}>Ver mi pase</button></div></>}
        <h2 className={styles.sectionTitle}>Todos los detalles</h2>
        {modules.filter((module) => module.visible).map((module) => <button key={module.id} className={styles.tile} onClick={() => setOpen(module.id)}>{module.label}<span aria-hidden="true">›</span></button>)}
        {phase !== "antes" && <button className={styles.tile} onClick={() => setOpen("rsvp")}>{rsvpLabel}<span aria-hidden="true">›</span></button>}
      </div>
    </main>
    {open && <EditorialDialog key={open} title={TITLES[open]} onClose={close}>
      {(open === "rsvp" || open === "dietas") && <EditorialRsvpForm invitadoId={invitado.id} nombre={invitado.nombre_pasajero} estado={estado} restricciones={restricciones} dietaryOnly={open === "dietas"} demo={demo} onSaved={saved} onClose={close} />}
      {open === "pase" && <>
        <div className={styles.ticket}><small>{merged.boarding_linea_aerea || "DREAMS AIRLINES"} · BOARDING PASS</small><h2>{names.join(" & ") || merged.footerNovios}</h2><div className={styles.ticketgrid}><div><span>PASAJERO</span>{passenger}</div><div><span>FECHA</span>{passDate}</div><div><span>DESTINO</span>{config.passLocationLabel || location}</div><div><span>ESTADO</span>{stateLabel}</div></div></div>
        {demo ? <p className={styles.muted}>Pase simbólico. No es un código de acceso ni incluye un QR válido.</p> : phase === "durante" && invitado.qr_code_token ? <div className={styles.stack}><InvitacionCheckInQr payload={invitado.qr_code_token} /></div> : <p className={styles.muted}>Tu invitación y los datos de la celebración, siempre a mano.</p>}
        <button className={styles.primary} onClick={() => setOpen("rsvp")}>{estado === "pendiente" ? "Confirmar asistencia" : "Modificar asistencia"}</button><button className={styles.secondary} style={{ marginTop: 10 }} onClick={() => window.print()}>Imprimir pase</button>
      </>}
      {open === "programa" && <div className={styles.module}>{programaHitos.length ? <InvitacionCronograma hitos={programaHitos} fechaEvento={merged.fecha_evento} fotosPorHito={programaFotosPorHito} /> : <p className={styles.sub}>Ceremonia y celebración. Horarios detallados por confirmar.</p>}</div>}
      {open === "ubicacion" && <><p className={styles.sub}>{config.locationDetail || merged.direccion_completa || merged.lugar_evento_linea}</p>{qrValue ? <a href={qrValue} target="_blank" rel="noopener noreferrer" className={styles.primary}>Abrir en mapas</a> : <p className={styles.muted}>La dirección exacta se compartirá cuando esté confirmada.</p>}</>}
      {open === "regalos" && <><p className={styles.sub} style={{ whiteSpace: "pre-line" }}>{regalos.texto_regalos || TEXTO_REGALOS_DEFAULT}</p>{giftUrl && <a className={styles.primary} href={giftUrl} target="_blank" rel="noopener noreferrer">Abrir lista de regalos</a>}</>}
      {open === "musica" && <div className={styles.module}><div className={styles.stack}>{playlists.spotify && <a className={styles.secondary} href={playlists.spotify} target="_blank" rel="noopener noreferrer">Abrir playlist en Spotify</a>}{playlists.appleMusic && <a className={styles.secondary} href={playlists.appleMusic} target="_blank" rel="noopener noreferrer">Abrir playlist en Apple Music</a>}{playlists.other && <a className={styles.secondary} href={playlists.other} target="_blank" rel="noopener noreferrer">Escuchar nuestra música</a>}</div>{musicColabEnabled && !demo && <InvitacionMusicaColaborativa invitationAccessToken={token} eventoId={invitado.evento_id || ""} invitacionConfirmada={estado === "confirmado"} spotifySyncDisponible={musicColabEnabled} surface="light" />}{demo && <p className={styles.sub}>Las propuestas de canciones están disponibles al abrir una invitación real.</p>}</div>}
      {open === "fotos" && <div className={styles.module}>{demo ? <p className={styles.sub}>Esta es una vista de ejemplo. Abre una invitación real para compartir y ver fotografías del evento.</p> : <><div className={styles.stack}>{photoAction}</div><LiveGallery eventoId={invitado.evento_id || ""} fotos={fotos} setFotos={setFotos} emptyHint="Comparte el primer recuerdo con el botón Compartir fotos." /></>}</div>}
      {open !== "rsvp" && open !== "dietas" && open !== "pase" && <div className={styles.stack}><button className={styles.secondary} onClick={close}>Volver a la invitación</button></div>}
    </EditorialDialog>}
  </div>;
}
