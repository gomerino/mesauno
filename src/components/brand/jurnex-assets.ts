/**
 * Rutas públicas del sistema de marca Jurnex (`/public/brand/jurnex/`).
 * Marca principal: círculo JURNEX en `fullPng` (1024²). `vectorFallback` = ilustración SVGO si hace falta impresión.
 */
export const JURNEX_BRAND = {
  logos: {
    /** @deprecated Respaldo vectorial; UI usa `fullPng` */
    simplified: "/brand/jurnex/logos/simplified/jurnex-logo-simplified.svg",
    /** Respaldo: avión+órbita SVG. Panel usa `JurnexOrbitIcon` → `fullPng` */
    icon: "/brand/jurnex/logos/icon/jurnex-icon-orbit.svg",
    /** Logo círculo (PNG oficial, cabecera, hero, JurnexMark) */
    fullPng: "/brand/jurnex/logos/full/jurnex-logo-full.png",
    /** Versión monocromo (blanco) del simplified */
    mono: "/brand/jurnex/logos/mono/jurnex-logo-white.svg",
  },
  appIcon: "/brand/jurnex/app/icon-base.svg",
} as const;

export type JurnexLogoVariant = keyof typeof JURNEX_BRAND.logos;
