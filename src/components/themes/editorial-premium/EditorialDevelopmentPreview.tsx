import { buildDemoInvitacion } from "@/lib/demo-invitation-mock";
import { mergeEventoParaPase } from "@/lib/evento-boarding";
import { EditorialPremiumTheme, type EditorialPreviewConfig } from "./EditorialPremiumTheme";
import styles from "./editorial.module.css";

export function EditorialDevelopmentPreview({ phase, boarding, contracts }: { phase?: string; boarding?: string; contracts?: boolean }) {
  const config: EditorialPreviewConfig = {
    phase: phase === "durante" || phase === "despues" ? phase : "antes",
    showBoardingPass: boarding !== "0",
    locationLabel: "La Casita de Cuentos · Buin",
    passLocationLabel: "Buin, Chile",
    timeDetail: "Horario de ejemplo",
  };
  const demo = buildDemoInvitacion({ nombreNovios: "Claudia & Gonzalo", fechaEvento: "2027-02-20" });
  demo.evento.direccion_evento_completa = "Camino de ejemplo 123, Buin, Región Metropolitana";
  demo.evento.hora_embarque = "12:00";
  demo.evento.motivo_viaje = "Los invitamos a celebrar esta nueva aventura con nosotros. Es nuestro viaje más importante: el día que unimos nuestras rutas y nos elegimos para seguir esta vida juntos.";
  demo.invitado.nombre_pasajero = "Invitado especial";
  if (contracts && config.phase === "durante") demo.invitado.invitado_acompanantes = [
    { id: "demo-acompanante-1", invitado_id: demo.invitado.id, nombre: "Acompañante de prueba uno", orden: 1 },
    { id: "demo-acompanante-2", invitado_id: demo.invitado.id, nombre: "Acompañante de prueba dos", orden: 2 },
  ];
  demo.merged = mergeEventoParaPase(demo.invitado, demo.evento);
  const link = (change: Record<string, string>) => `?${new URLSearchParams({ theme: "editorial-premium", phase: config.phase || "antes", boarding: config.showBoardingPass ? "1" : "0", ...change })}`;
  return <>
    <EditorialPremiumTheme {...demo} config={config} demo={!contracts} token="editorial-preview" qrValue="https://www.google.com/maps/search/?api=1&query=Buin%2CChile" playlists={{ spotify: "https://open.spotify.com/", appleMusic: null, other: null, showSpotifyEmbed: false }} programaHitos={[{ id: "demo-hito", evento_id: demo.evento.id, hora: "12:00:00", titulo: "Ceremonia", descripcion_corta: "Celebremos juntos", lugar_nombre: "Buin", ubicacion_url: null, icono: "Church", orden: 0 }, { id: "demo-brindis", evento_id: demo.evento.id, hora: "13:00:00", titulo: "Brindis y encuentro", descripcion_corta: "Un momento para compartir y celebrar", lugar_nombre: "Jardín", ubicacion_url: null, icono: "GlassWater", orden: 1 }, { id: "demo-fiesta", evento_id: demo.evento.id, hora: "15:00:00", titulo: "La celebración", descripcion_corta: "Música, baile y recuerdos juntos", lugar_nombre: null, ubicacion_url: null, icono: "Music", orden: 2 }]} programaFotosPorHito={{}} albumFotos={[]} musicColabEnabled={Boolean(contracts)} recentTracks={[]} topTracks={[]} apoyoTrackUris={[]} regalos={{ regalos_activos: true, url_regalos: "https://example.com/regalos", texto_regalos: "Tu presencia es nuestro mejor regalo." }} />
    <aside className={styles.previewTools} aria-label="Controles de desarrollo"><p>Vista de desarrollo · datos de ejemplo{contracts ? " · prueba de contratos" : ""}</p><nav>{(["antes", "durante", "despues"] as const).map((value) => <a key={value} href={link({ phase: value })}>{value === "antes" ? "Antes" : value === "durante" ? "Durante" : "Después"}</a>)}<a href={link({ boarding: config.showBoardingPass ? "0" : "1" })}>{config.showBoardingPass ? "Ocultar pase" : "Mostrar pase"}</a></nav></aside>
  </>;
}
