"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type Tone = "default" | "success" | "danger" | "muted" | "warning";

const base =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide " +
  "transition-[transform,box-shadow,border-color,background-color] duration-jurnex ease-in-out";

type Props = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  active?: boolean;
  tone?: Tone;
};

const toneInactive: Record<Tone, string> = {
  default:
    "border-jurnex-border bg-jurnex-surface text-jurnex-text-secondary hover:scale-[1.01] hover:border-jurnex-border hover:bg-jurnex-surface-hover hover:shadow-jurnex-glow",
  success: "border-jurnex-success/35 bg-jurnex-success/12 text-jurnex-success hover:scale-[1.01] hover:shadow-jurnex-glow",
  danger: "border-jurnex-error/35 bg-jurnex-error/10 text-jurnex-error hover:scale-[1.01] hover:shadow-jurnex-glow",
  muted: "border-jurnex-border bg-jurnex-surface text-jurnex-text-muted hover:scale-[1.01] hover:shadow-jurnex-glow",
  warning: "border-jurnex-warning/35 bg-jurnex-warning/10 text-jurnex-warning hover:scale-[1.01] hover:shadow-jurnex-glow",
};

export function Chip({ children, className, active = false, tone = "default", ...rest }: Props) {
  return (
    <span
      className={cn(
        base,
        active
          ? "scale-[1.01] border-jurnex-primary/45 bg-jurnex-primary-soft text-jurnex-primary shadow-jurnex-glow"
          : toneInactive[tone],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
