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
  /** Texto origen (antes del avión), ej. ciudad o código. */
  originCode: string;
  /** Texto destino (después del avión). */
  destCode: string;
  /** Ruta del logo en /public o URL https */
  logoSrc?: string;
  /** Emblema secundario (URL o /public), opcional */
  emblemSrc?: string;
  airlineName?: string;
  tagline?: string;
  className?: string;
  /** Colores: legacy azul boarding (#001d66) o oro + marino (como el check-in). */
  palette?: "legacy" | "invite";
  /** `branded` = C&G · Boda; `airports` = origen/destino personalizados. */
  routeDisplay?: "branded" | "airports";
};

/**
 * Cabecera de boarding pass digital estilo aerolínea: branding + ruta.
 */
function isRemoteLogo(src: string): boolean {
  return /^https?:\/\//i.test(src.trim());
}

export function BoardingPassHeader({
  originCode,
  destCode,
  logoSrc = "/dreams-airlines-logo.png",
  emblemSrc,
  airlineName = "DREAMS AIRLINES",
  tagline = "together, forever",
  className = "",
  palette = "legacy",
  routeDisplay = "branded",
}: BoardingPassHeaderProps) {
  const from = originCode.trim() || "—";
  const to = destCode.trim() || "—";
  const longRoute = routeDisplay === "airports" && (from.length > 4 || to.length > 4);
  const routeLeft = routeDisplay === "airports" ? from : "C&G";
  const routeRight = routeDisplay === "airports" ? to : "Boda";
  const logoRemote = isRemoteLogo(logoSrc);
  const emblemRemote = emblemSrc ? isRemoteLogo(emblemSrc) : false;

  return (
    <header
      className={`${styles.bpHeader} ${inter.variable} ${className}`.trim()}
      data-palette={palette}
    >
      <div className={styles.bpBranding}>
        <div className={styles.bpLogoWrap}>
          {logoRemote ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt=""
              className="h-full w-full object-contain object-left"
            />
          ) : (
            <Image
              src={logoSrc}
              alt="Dreams Airlines"
              fill
              sizes="(max-width: 379px) 92px, 100px"
              className="object-contain object-left"
              priority
            />
          )}
        </div>
        <div className={styles.bpBrandText}>
          <p className={styles.bpAirlineName}>{airlineName}</p>
          <p className={styles.bpTagline}>{tagline}</p>
        </div>
        {emblemSrc ? (
          <div
            className={`relative h-7 w-7 shrink-0 sm:h-8 sm:w-8 ${palette === "invite" ? "opacity-95" : "opacity-90"}`}
          >
            {emblemRemote ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={emblemSrc} alt="" className="h-full w-full object-contain" />
            ) : (
              <Image src={emblemSrc} alt="" fill sizes="32px" className="object-contain" />
            )}
          </div>
        ) : null}
      </div>

      <div className={styles.bpDivider} aria-hidden />

      <div className={styles.bpRoute}>
        <span
          className={`${styles.bpRouteCode} ${longRoute ? styles.bpRouteText : ""}`.trim()}
        >
          {routeLeft}
        </span>
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
        <span
          className={`${styles.bpRouteCode} ${longRoute ? styles.bpRouteText : ""}`.trim()}
        >
          {routeRight}
        </span>
      </div>
    </header>
  );
}
