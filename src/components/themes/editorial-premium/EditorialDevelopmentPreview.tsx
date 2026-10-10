import { buildDemoInvitacion } from "@/lib/demo-invitation-mock";
import { mergeEventoParaPase } from "@/lib/evento-boarding";
import { EditorialPremiumTheme, type EditorialPreviewConfig } from "./EditorialPremiumTheme";
import styles from "./editorial.module.css";

export function EditorialDevelopmentPreview({ phase, boarding, contracts }: { phase?: string; boarding?: string; contracts?: boolean }) {
  const config: EditorialPreviewConfig = {
    phase: phase === "durante" || phase === "despues" ? phase : "antes",
    showBoardingPass: boarding !== "0",
    locationLabel: "Buin",
    passLocationLabel: "Buin, Chile",
    locationDetail: "Buin, Región Metropolitana · Dirección por confirmar",
    timeDetail: "Horario de ejemplo",
  };
  const demo = buildDemoInvitacion({ nombreNovios: "Claudia & Gonzalo", fechaEvento: "2027-02-20" });
  demo.evento.hora_embarque = "12:00";
  demo.evento.motivo_viaje = "Hay viajes que cambian la vida. Nos encantaría compartir este contigo.";
  demo.invitado.nombre_pasajero = "Invitado especial";
  demo.merged = mergeEventoParaPase(demo.invitado, demo.evento);
  const link = (change: Record<string, string>) => `?${new URLSearchParams({ theme: "editorial-premium", phase: config.phase || "antes", boarding: config.showBoardingPass ? "1" : "0", ...change })}`;
  return <>
    <EditorialPremiumTheme {...demo} config={config} demo={!contracts} token="editorial-preview" qrValue="https://www.google.com/maps/search/?api=1&query=Buin%2CChile" playlists={{ spotify: "https://open.spotify.com/", appleMusic: null, other: null, showSpotifyEmbed: false }} programaHitos={contracts ? [{ id: "demo-hito", evento_id: demo.evento.id, hora: "12:00:00", titulo: "Ceremonia", descripcion_corta: "Celebremos juntos", lugar_nombre: "Buin", ubicacion_url: null, icono: "Church", orden: 0 }] : []} programaFotosPorHito={{}} albumFotos={[]} musicColabEnabled={Boolean(contracts)} recentTracks={[]} topTracks={[]} apoyoTrackUris={[]} regalos={{ regalos_activos: true, url_regalos: "https://example.com/regalos", texto_regalos: "Tu presencia es nuestro mejor regalo." }} />
    <aside className={styles.previewTools} aria-label="Controles de desarrollo"><p>Vista de desarrollo · datos de ejemplo{contracts ? " · prueba de contratos" : ""}</p><nav>{(["antes", "durante", "despues"] as const).map((value) => <a key={value} href={link({ phase: value })}>{value === "antes" ? "Antes" : value === "durante" ? "Durante" : "Después"}</a>)}<a href={link({ boarding: config.showBoardingPass ? "0" : "1" })}>{config.showBoardingPass ? "Ocultar pase" : "Mostrar pase"}</a></nav></aside>
  </>;
}
