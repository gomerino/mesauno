import type { ReactNode } from "react";
import { panelSurfaceSecondary } from "./panel-ds-classes";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Tarjeta lateral (sidebar): superficie nivel 2. */
export function SideCard({ children, className = "" }: Props) {
  return <div className={`${panelSurfaceSecondary} ${className}`.trim()}>{children}</div>;
}
