"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

const fieldClass =
  "w-full rounded-jurnex-sm border border-jurnex-border bg-jurnex-surface px-3 py-2 text-sm text-jurnex-text-primary " +
  "placeholder:text-jurnex-text-muted " +
  "transition-[border-color,box-shadow] duration-jurnex ease-in-out " +
  "focus:border-jurnex-primary focus:outline-none focus:ring-2 focus:ring-jurnex-primary/25";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...rest },
  ref
) {
  return <input ref={ref} className={cn(fieldClass, className)} {...rest} />;
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...rest },
  ref
) {
  return <textarea ref={ref} className={cn(fieldClass, "min-h-[72px] resize-y", className)} {...rest} />;
});
