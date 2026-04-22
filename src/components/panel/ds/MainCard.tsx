import type { ReactNode } from "react";
import { panelCard, panelSurfaceSecondary } from "./panel-ds-classes";

type Props = {
  children: ReactNode;
  className?: string;
  /** Sin backdrop-blur si el contenido es muy denso (listas largas). */
  noBlur?: boolean;
};

export function MainCard({ children, className = "", noBlur = false }: Props) {
  const surface = noBlur ? panelSurfaceSecondary : panelCard;
  return <div className={`${surface} ${className}`.trim()}>{children}</div>;
}
