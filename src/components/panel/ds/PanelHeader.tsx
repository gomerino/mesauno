import type { ReactNode } from "react";
import { panelDivider } from "./panel-ds-classes";

export type PanelHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  noDivider?: boolean;
  className?: string;
};

/**
 * Cabecera de página del panel: jerarquía tipográfica fija sobre fondo oscuro.
 */
export function PanelHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  noDivider = false,
  className = "",
}: PanelHeaderProps) {
  const base = noDivider ? "" : `${panelDivider} pb-4`;
  return (
    <header className={`${base} ${className}`.trim()}>
      {eyebrow ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-400/85">{eyebrow}</p>
      ) : null}
      <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h1>
      {subtitle ? <div className="mt-1 text-sm text-white/70">{subtitle}</div> : null}
      {actions ? <div className="mt-2">{actions}</div> : null}
    </header>
  );
}
