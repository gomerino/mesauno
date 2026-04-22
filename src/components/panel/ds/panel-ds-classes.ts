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

/** Botón primario panel (teal sobre oscuro). */
export const panelBtnPrimary =
  "inline-flex items-center justify-center rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-black transition-colors duration-200 hover:bg-teal-400 disabled:pointer-events-none disabled:opacity-50";

/** Botón secundario — borde sutil. */
export const panelBtnSecondary =
  "inline-flex items-center justify-center rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-white/90 transition-colors duration-200 hover:bg-white/5 disabled:pointer-events-none disabled:opacity-50";

/** Enlace / ghost. */
export const panelBtnGhost =
  "inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-sm text-white/60 transition-colors duration-200 hover:text-white disabled:opacity-50";

/** Barra de progreso panel (teal → oro). */
export const panelProgressTrack = "h-1 w-full overflow-hidden rounded-full bg-white/10";
export const panelProgressFill =
  "h-full rounded-full bg-gradient-to-r from-teal-400 to-[#F5C451]";
