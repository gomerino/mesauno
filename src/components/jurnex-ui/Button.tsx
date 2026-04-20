"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

const base =
  "inline-flex items-center justify-center gap-2 rounded-jurnex-md px-4 py-2.5 text-sm font-semibold " +
  "transition-[transform,box-shadow] duration-jurnex ease-in-out " +
  "hover:scale-[1.01] hover:shadow-jurnex-glow active:scale-[0.98] " +
  "disabled:pointer-events-none disabled:opacity-50";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-jurnex-primary text-jurnex-bg shadow-jurnex-glow hover:brightness-110 hover:shadow-jurnex-glow-hover",
  secondary:
    "border border-jurnex-border bg-jurnex-surface text-jurnex-text-primary hover:border-jurnex-primary/30 hover:bg-jurnex-surface-hover hover:shadow-jurnex-glow",
  ghost: "border border-transparent bg-transparent text-jurnex-text-secondary hover:bg-jurnex-surface-hover hover:text-jurnex-text-primary",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
};

export function Button({ children, className, variant = "primary", type = "button", ...rest }: Props) {
  return (
    <button type={type} className={cn(base, variants[variant], className)} {...rest}>
      {children}
    </button>
  );
}
