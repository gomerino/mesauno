import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Permite overridear el ancho cuando un flujo lo requiera (ej. success page). */
  className?: string;
};

/**
 * Contenedor único del panel: ancho máximo y centrado horizontal consistente.
 * Usalo en todas las pages de `/panel/*` para mantener el mismo ritmo vertical
 * y la misma grilla horizontal entre módulos y subpáginas.
 */
export function PanelPageContainer({ children, className = "" }: Props) {
  return <div className={`mx-auto w-full max-w-4xl ${className}`.trim()}>{children}</div>;
}
