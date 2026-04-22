import type { ReactNode } from "react";
import {
  panelBgPage,
  panelColMain,
  panelColSidebar,
  panelContainer,
  panelContainerNarrow,
  panelGridMainSidebar,
  panelPb,
} from "./panel-ds-classes";

type PanelLayoutProps = {
  children: ReactNode;
  /** Contenido más estrecho (formularios largos legibles), equivale a max-w-4xl. */
  narrow?: boolean;
  className?: string;
};

/**
 * Envoltura de página del panel: base oscura, contenedor centrado, padding inferior para bottom nav.
 */
export function PanelLayout({ children, narrow = false, className = "" }: PanelLayoutProps) {
  const inner = narrow ? panelContainerNarrow : panelContainer;
  return (
    <div className={`${panelBgPage} ${panelPb} ${className}`.trim()}>
      <div className={inner}>{children}</div>
    </div>
  );
}

type PanelContentGridProps = {
  main: ReactNode;
  sidebar?: ReactNode;
  className?: string;
};

/**
 * Grilla 8/4 en lg; una columna en móvil. Sidebar siempre secundaria.
 */
export function PanelContentGrid({ main, sidebar, className = "" }: PanelContentGridProps) {
  return (
    <div className={`${panelGridMainSidebar} ${className}`.trim()}>
      <div className={panelColMain}>{main}</div>
      {sidebar ? <aside className={panelColSidebar}>{sidebar}</aside> : null}
    </div>
  );
}
