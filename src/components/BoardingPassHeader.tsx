import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "./BoardingPassHeader.module.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-bp-header",
  weight: ["500", "600", "700"],
  display: "swap",
});

export type BoardingPassHeaderProps = {
  /** Código IATA origen (ej. SCL) */
  originCode: string;
  /** Código IATA destino (ej. CAS) */
  destCode: string;
  /** Ruta del logo en /public */
  logoSrc?: string;
  airlineName?: string;
  tagline?: string;
  className?: string;
};

/**
 * Cabecera de boarding pass digital estilo aerolínea: branding + ruta.
 */
export function BoardingPassHeader({
  originCode,
  destCode,
  logoSrc = "/dreams-airlines-logo.png",
  airlineName = "DREAMS AIRLINES",
  tagline = "LOVE IS OUR DESTINATION",
  className = "",
}: BoardingPassHeaderProps) {
  const from =
    originCode.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "—";
  const to = destCode.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "—";

  return (
    <header className={`${styles.bpHeader} ${inter.variable} ${className}`.trim()}>
      <div className={styles.bpBranding}>
        <div className={styles.bpLogoWrap}>
          <Image
            src={logoSrc}
            alt="Dreams Airlines"
            fill
            sizes="(max-width: 379px) 120px, 140px"
            className="object-contain object-left"
            priority
          />
        </div>
        <div className={styles.bpBrandText}>
          <p className={styles.bpAirlineName}>{airlineName}</p>
          <p className={styles.bpTagline}>together, forever</p>
        </div>
      </div>

      <div className={styles.bpDivider} aria-hidden />

      <div className={styles.bpRoute}>
        <span className={styles.bpRouteCode}>C&G</span>
        <span className={styles.bpRoutePlane} aria-hidden>
          ✈
        </span>
        <span className={styles.bpRouteCode}>BODA</span>
      </div>
    </header>
  );
}
