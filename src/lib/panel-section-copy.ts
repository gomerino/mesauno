/**
 * Copy y jerarquía alineados entre `/panel/viaje`, `/panel/pasajeros` y `/panel/recuerdos`
 * para que el cambio de pantalla no rompa el ritmo visual.
 */
export const PANEL_VIAJE_TITLE = "Tu viaje";
export const PANEL_VIAJE_SUBTITLE = "Prepara datos, invitación y experiencia.";

export const PANEL_INVITADOS_TITLE = "Tus Pasajeros";
export const PANEL_INVITADOS_SUBTITLE = "Lista, envíos y confirmaciones.";

export const PANEL_RECUERDOS_EYEBROW = "Aterrizaje";
export const PANEL_RECUERDOS_TITLE = "Lo que queda del viaje";
export const PANEL_RECUERDOS_SUBTITLE =
  "Un lugar para volver cuando el gran día pasó: regalos, recuerdos y los detalles que querés conservar.";

/** Mismo contenedor que en la ficha Viaje (sincroniza bordes y márgenes). */
export const panelJourneyPageWrapClass = "mx-auto w-full max-w-5xl space-y-4 md:space-y-5";

/** Línea fina bajo título (solo si hace falta; Viaje/Invitados sin franja fija en header). */
export const panelSectionEyebrowClass =
  "text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-400/80";

/** Clases compartidas: mismo h1 y micro. */
export const panelSectionTitleClass =
  "font-display text-2xl font-bold tracking-tight text-white md:text-3xl";
export const panelSectionSubtitleClass = "text-sm text-white/60";
