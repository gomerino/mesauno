"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Más padding interior */
  padded?: boolean;
  /** Si es false, sin hover scale (bloques estáticos). */
  interactive?: boolean;
};

const shellBase =
  "rounded-jurnex-md border border-jurnex-border bg-jurnex-surface/90 backdrop-blur-xl shadow-jurnex-card shadow-jurnex-glow";

const shellInteractive =
  "transition-[transform,box-shadow] duration-jurnex ease-in-out hover:scale-[1.01] hover:shadow-jurnex-glow-hover hover:shadow-jurnex-card";

export function Card({ children, className, padded = true, interactive = true, ...rest }: Props) {
  return (
    <div
      className={cn(shellBase, interactive ? shellInteractive : "", padded ? "p-4 sm:p-5" : "", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
