/** Clases reutilizables del panel (Jurnex dark luxury). Sin tocar tailwind.config. */

export const panelBgPage = "min-h-full bg-jurnex-bg";

export const panelContainer =
  "relative z-[1] mx-auto w-full max-w-[1200px] px-6";

export const panelContainerNarrow =
  "relative z-[1] mx-auto w-full max-w-4xl px-6";

/** Espacio inferior: bottom nav + safe area (notch / home indicator). */
export const panelPb = "pb-[calc(6rem+env(safe-area-inset-bottom,0px))]";

/** Nivel 1 — contenido clave (formulario principal). */
export const panelSurfaceKey =
  "rounded-xl border border-white/12 bg-black/40 shadow-md";

/** Nivel 2 — contenido secundario. */
export const panelSurfaceSecondary = "rounded-xl border border-white/5 bg-black/20";

/** @deprecated Preferir panelSurfaceKey / panelSurfaceSecondary. */
export const panelCard =
  "rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm";

/** @deprecated Preferir panelSurfaceKey / panelSurfaceSecondary. */
export const panelCardStatic = "rounded-xl border border-white/10 bg-black/30";

export const panelDivider = "border-b border-white/10";

export const panelGridMainSidebar =
  "mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6";

export const panelColMain = "lg:col-span-8";

export const panelColSidebar = "lg:col-span-4";

/**
 * Capa visual / acción (sin `rounded-full` ni cuerpo de tipografía) — `JourneyPrimaryCta` y CTA píldora comparten esto.
 * Para un botón listo, usar `panelCtaJurnexPrimary` o componer + `text-sm font-semibold rounded-full …`.
 */
export const panelCtaJurnexGoldSurface =
  "bg-gradient-to-r from-invite-gold to-invite-gold-deep text-slate-900 shadow-lg ring-1 ring-yellow-400/25";
export const panelCtaJurnexGoldAction =
  "transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50";

/**
 * CTA oro: layout fijo (píldora, cuerpo semibold) — añade `w-full min-h-[48px] px-* py-*` según el bloque.
 * Alias: `panelBtnPrimary` (mismo valor).
 */
export const panelCtaJurnexPrimary = [
  "inline-flex items-center justify-center rounded-full text-sm font-semibold",
  panelCtaJurnexGoldSurface,
  panelCtaJurnexGoldAction,
].join(" ");

/**
 * Tamaño y relleno del CTA de «Siguiente escala» (`JourneyPrimaryCta`):
 * píldora mín. 200px de ancho a partir de `sm`, aire horizontal `px-6` y `min-h` 48.
 */
export const panelCtaJurnexJourneyPillLayout =
  "min-h-[48px] w-full justify-center px-6 py-3.5 sm:w-auto sm:min-w-[200px]";

/**
 * Misma píldora pero siempre a todo el ancho (barra fija móvil y móvil «pasajeros»; sin `sm:w-auto`).
 */
export const panelCtaJurnexJourneyPillLayoutFull = "min-h-[48px] w-full justify-center px-6 py-3.5";

/** @deprecated Mismo criterio oro; nombre histórico — usar `panelCtaJurnexPrimary` o los tokens de oro. */
export const panelBtnPrimary = panelCtaJurnexPrimary;

/** Botón secundario — borde sutil. */
export const panelBtnSecondary =
  "inline-flex items-center justify-center rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-white/90 transition-colors duration-200 hover:bg-white/5 disabled:pointer-events-none disabled:opacity-50";

/** Enlace / ghost. */
export const panelBtnGhost =
  "inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-sm text-white/60 transition-colors duration-200 hover:text-white disabled:opacity-50";

/** Barra de progreso panel (teal → oro). */
export const panelProgressTrack = "h-1 w-full overflow-hidden rounded-full bg-white/10";
export const panelProgressFill = "h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-500";
