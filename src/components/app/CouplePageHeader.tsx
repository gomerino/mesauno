import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle: ReactNode;
  /** Etiqueta corta encima del título, p. ej. "Tu espacio" */
  eyebrow?: string;
  className?: string;
  /** Clases extra para el h1 (p. ej. tamaño responsive). */
  titleClassName?: string;
};

export function CouplePageHeader({
  title,
  subtitle,
  eyebrow,
  className = "",
  titleClassName = "",
}: Props) {
  return (
    <header className={`max-w-2xl ${className}`}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-400/90">{eyebrow}</p>
      ) : null}
      <h1 className={`font-display text-3xl font-bold text-white${titleClassName ? ` ${titleClassName}` : ""}`}>
        {title}
      </h1>
      <div className="mt-2 text-base leading-relaxed text-slate-400">{subtitle}</div>
    </header>
  );
}
