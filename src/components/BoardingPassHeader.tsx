import Image from "next/image";
import { Inter } from "next/font/google";
import { Plane } from "lucide-react";
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
  /** Colores: legacy azul boarding (#001d66) o oro + marino (como el check-in). */
  palette?: "legacy" | "invite";
  /** `branded` = C&G · BODA; `airports` = códigos IATA de origen/destino. */
  routeDisplay?: "branded" | "airports";
};

/**
 * Cabecera de boarding pass digital estilo aerolínea: branding + ruta.
 */
export function BoardingPassHeader({
  originCode,
  destCode,
  logoSrc = "/dreams-airlines-logo.png",
  airlineName = "DREAMS AIRLINES",
  tagline = "together, forever",
  className = "",
  palette = "legacy",
  routeDisplay = "branded",
}: BoardingPassHeaderProps) {
  const from =
    originCode.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "—";
  const to = destCode.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "—";
  const routeLeft = routeDisplay === "airports" ? from : "C&G";
  const routeRight = routeDisplay === "airports" ? to : "BODA";

  return (
    <header
      className={`${styles.bpHeader} ${inter.variable} ${className}`.trim()}
      data-palette={palette}
    >
      <div className={styles.bpBranding}>
        <div className={styles.bpLogoWrap}>
          <Image
            src={logoSrc}
            alt="Dreams Airlines"
            fill
            sizes="(max-width: 379px) 92px, 100px"
            className="object-contain object-left"
            priority
          />
        </div>
        <div className={styles.bpBrandText}>
          <p className={styles.bpAirlineName}>{airlineName}</p>
          <p className={styles.bpTagline}>{tagline}</p>
        </div>
      </div>

      <div className={styles.bpDivider} aria-hidden />

      <div className={styles.bpRoute}>
        <span className={styles.bpRouteCode}>{routeLeft}</span>
        {palette === "invite" ? (
          <Plane
            className="h-[0.85rem] w-[0.85rem] shrink-0 text-invite-navy sm:h-4 sm:w-4"
            strokeWidth={2.25}
            aria-hidden
          />
        ) : (
          <span className={styles.bpRoutePlane} aria-hidden>
            ✈
          </span>
        )}
        <span className={styles.bpRouteCode}>{routeRight}</span>
      </div>
    </header>
  );
}
