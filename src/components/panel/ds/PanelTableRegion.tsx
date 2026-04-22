import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  minWidth?: string;
};

/**
 * Contenedor de tabla/lista con scroll horizontal estable (sin saltos de layout).
 */
export function PanelTableRegion({ children, className = "", minWidth = "min-w-[880px]" }: Props) {
  return (
    <div className={`overflow-x-auto ${className}`.trim()}>
      <div className={`w-full ${minWidth}`}>{children}</div>
    </div>
  );
}
