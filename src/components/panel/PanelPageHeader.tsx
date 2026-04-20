import type { ReactNode } from "react";

type Props = {
  /** Etiqueta corta encima del título (ej. "Tu evento"). */
  eyebrow?: string;
  /** Título principal de la página. */
  title: string;
  /** Subtítulo opcional — acepta texto o nodos (links, etc.). */
  subtitle?: ReactNode;
  /** Slot opcional debajo del subtítulo (ej. CTA "Ver resumen"). */
  actions?: ReactNode;
  /** Si quieres omitir el divider inferior. */
  noDivider?: boolean;
  className?: string;
};

/**
 * Header único para páginas del panel. Jerarquía:
 *  - eyebrow `text-[10px] tracking-[0.22em] text-teal-400/80`
 *  - h1 `text-2xl md:text-3xl`
 *  - subtítulo `text-sm text-slate-400`
 * Replica el patrón ya usado en `/panel/evento`, `/panel/programa` e `/panel/invitados`.
 */
export function PanelPageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  noDivider = false,
  className = "",
}: Props) {
  const base = noDivider ? "" : "border-b border-jurnex-border pb-4";
  return (
    <header className={`${base} ${className}`.trim()}>
      {eyebrow ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-jurnex-primary/85">{eyebrow}</p>
      ) : null}
      <h1 className="font-display text-2xl font-bold tracking-tight text-jurnex-text-primary md:text-3xl">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-jurnex-text-secondary">{subtitle}</p> : null}
      {actions ? <div className="mt-2">{actions}</div> : null}
    </header>
  );
}
