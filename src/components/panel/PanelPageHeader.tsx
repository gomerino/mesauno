import type { PanelHeaderProps } from "@/components/panel/ds/PanelHeader";
import { PanelHeader } from "@/components/panel/ds/PanelHeader";

export type { PanelHeaderProps };

/**
 * Cabecera de página del panel (alias del design system).
 * Misma API que antes; estilos alineados a fondo oscuro Jurnex.
 */
export function PanelPageHeader(props: PanelHeaderProps) {
  return <PanelHeader {...props} />;
}
