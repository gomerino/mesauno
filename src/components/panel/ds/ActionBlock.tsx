import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Alineación de acciones en la cabecera de una tarjeta. */
  align?: "start" | "end" | "between";
};

export function ActionBlock({ children, className = "", align = "end" }: Props) {
  const flex =
    align === "between"
      ? "flex flex-wrap items-center justify-between gap-2"
      : align === "start"
        ? "flex flex-wrap items-center justify-start gap-2"
        : "flex flex-wrap items-center justify-end gap-2";
  return <div className={`${flex} ${className}`.trim()}>{children}</div>;
}
