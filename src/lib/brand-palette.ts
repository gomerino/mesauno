/**
 * Colores de marca (invitación premium, Jurnex, superficies fijas) — misma croma que
 * `tailwind.config` (importa desde aquí). Usar en emails/HTML donde no aplica Tailwind.
 */
export const brandInvite = {
  cream: "#FDFDF5",
  sand: "#F4F1EA",
  gold: "#D4AF37",
  navy: "#1A2B48",
  parchment: "#F9F6F0",
  warm: "#F0E8DC",
  /** Sombreado cálido hero premium (de arena a oro) */
  haze: "#E8DFD0",
  /** Cerca de `cream`, fondos tipo postal */
  paper: "#FFF9F0",
  "gold-mid": "#C9A22E",
  "gold-deep": "#B8941F",
  /** Borde de sello / oro en sombra (barra pase) */
  "gold-shadow": "#C4A12C",
} as const;

export const brandInviteJurnex = {
  cream: "#F4F0E8",
  sand: "#ECE6DC",
  malt: "#E8E2D4",
  gold: "#E89A1E",
  "gold-bright": "#E4CE5A",
  navy: "#02182A",
} as const;

/** Fijos de terceros / UI global */
export const brandSpotify = "#1DB954" as const;

/** Superficies de modales oscuros (checkout, CTA) — alineadas al panel. */
export const brandJurnexModals = {
  checkoutFrom: "#162032",
  checkoutTo: "#0f172a",
  /** Barra fija móvil panel: dock oscuro bajo el viewport */
  dock: "#070b14",
} as const;

/** Acento “Fiesta” en el journey del panel (gradientes, nav). */
export const brandJourneyFiesta = {
  gold: "#F5C451",
  light: "#F5D78A",
} as const;
