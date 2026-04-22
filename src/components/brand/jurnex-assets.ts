/**
 * Rutas públicas del sistema de marca Jurnex (`/public/brand/jurnex/`).
 * Logo full en PNG: colocá el archivo original en `logos/full/jurnex-logo-full.png` (no commitear reemplazos si son privados).
 */
export const JURNEX_BRAND = {
  logos: {
    /** Navbar, UI compacta — círculo + órbita + avión + pareja simplificada */
    simplified: "/brand/jurnex/logos/simplified/jurnex-logo-simplified.svg",
    /** Sidebar / mobile — avión + trayectoria */
    icon: "/brand/jurnex/logos/icon/jurnex-icon-orbit.svg",
    /** Landing — asset raster original (si falta el archivo, el componente usa simplified como respaldo) */
    fullPng: "/brand/jurnex/logos/full/jurnex-logo-full.png",
    /** Versión monocromo (blanco) del simplified */
    mono: "/brand/jurnex/logos/mono/jurnex-logo-white.svg",
  },
  appIcon: "/brand/jurnex/app/icon-base.svg",
} as const;

export type JurnexLogoVariant = keyof typeof JURNEX_BRAND.logos;
