import { Plane, ArrowDown } from "lucide-react";
import type { CSSProperties } from "react";
import styles from "./editorial-cover.module.css";

type Props = {
  names: string[];
  fallbackName: string;
  date: string;
  location: string;
  phase: "antes" | "durante" | "despues";
  photoEnabled: boolean;
  onSharePhotos?: () => void;
  cover?: { src: string; alt: string; positionMobile?: string; positionDesktop?: string };
};

export const EDITORIAL_PARIS_COVER = "/images/editorial-premium/foto-paris-original.png";

export function EditorialCover({ names, fallbackName, date, location, phase, photoEnabled, cover, onSharePhotos }: Props) {
  const label = phase === "antes" || !photoEnabled ? "Ver detalles y confirmar" : phase === "durante" ? "Compartir fotos" : "Ver los recuerdos";
  return <header className={styles.hero} data-testid="editorial-hero" style={{
    "--photo-mobile-position": cover?.positionMobile || "50% 57%",
    "--photo-desktop-position": cover?.positionDesktop || "50% 58%",
  } as CSSProperties}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className={styles.photo} src={cover?.src || EDITORIAL_PARIS_COVER} alt={cover?.alt || "Una pareja frente a la Torre Eiffel en París"} fetchPriority="high" />
    <div className={styles.shade} />
    <div className={styles.topline}><p>{phase === "antes" ? "Nos casamos" : phase === "durante" ? "Hoy celebramos" : "Nuestros recuerdos"}</p><div className={styles.flightLine} aria-hidden="true"><Plane size={22} fill="currentColor" strokeWidth={1} /></div></div>
    <div className={styles.copy}>
      <h1>{names.length === 2 ? <><span>{names[0]}</span><span className={styles.ampersand}>&amp;</span><span>{names[1]}</span></> : <span>{fallbackName}</span>}</h1>
      <div className={styles.facts}><p>{date}</p><p>{location}</p></div>
      <button type="button" className={styles.continue} onClick={() => {
        if (phase === "durante" && photoEnabled && onSharePhotos) { onSharePhotos(); return; }
        const content = document.getElementById("editorial-content");
        content?.focus({ preventScroll: true });
        content?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      }}>{label}<ArrowDown size={19} strokeWidth={1.5} aria-hidden="true" /></button>
    </div>
    <svg className={styles.curve} viewBox="0 0 852 64" preserveAspectRatio="none" aria-hidden="true"><path d="M0 38 C110 73 215 71 306 38 C394 1 446 1 550 38 C650 72 752 73 852 38 L852 64 L0 64 Z" /></svg>
  </header>;
}

export function EditorialJourney({ message }: { message: string }) {
  return <section className={styles.journey} aria-labelledby="editorial-journey-title" data-testid="editorial-journey">
    <div className={styles.journeyMark} aria-hidden="true"><span /><Plane size={26} fill="currentColor" strokeWidth={1} /><span /></div>
    <h2 id="editorial-journey-title">Nuestro viaje</h2>
    <div className={styles.rule} aria-hidden="true" />
    <p className={styles.message}>{message}</p>
  </section>;
}
