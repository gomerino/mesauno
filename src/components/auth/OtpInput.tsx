"use client";

import { cn } from "@/components/jurnex-ui/cn";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/** Mínimo de dígitos para enviar a Supabase (OTP email). */
export const OTP_LENGTH_MIN = 6;
/** Máximo que acepta el campo (Supabase puede enviar 6–8). */
export const OTP_LENGTH_MAX = 8;

type Props = {
  value: string;
  onChange: (next: string) => void;
  lengthMin?: number;
  lengthMax?: number;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  id?: string;
  className?: string;
};

export function sanitizeOtpDigits(raw: string, lengthMax: number): string {
  return raw.replace(/\D/g, "").slice(0, lengthMax);
}

export function otpTieneLongitudValida(value: string, lengthMin: number): boolean {
  return value.length >= lengthMin;
}

/**
 * Un solo `<input>` numérico con rejilla visual de segmentos (estilo app bancaria).
 * Pegado desde SMS/correo y teclado numérico en mobile.
 */
export function OtpInput({
  value,
  onChange,
  lengthMin = OTP_LENGTH_MIN,
  lengthMax = OTP_LENGTH_MAX,
  disabled,
  invalid,
  autoFocus,
  id = "otp-code",
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = useCallback(
    (raw: string) => {
      onChange(sanitizeOtpDigits(raw, lengthMax));
    },
    [onChange, lengthMax],
  );

  const moverCursorAlFinal = useCallback(() => {
    const el = inputRef.current;
    if (!el || document.activeElement !== el) return;
    const len = sanitizeOtpDigits(el.value, lengthMax).length;
    try {
      el.setSelectionRange(len, len);
    } catch {
      /* noop */
    }
  }, [lengthMax]);

  useEffect(() => {
    if (!autoFocus || disabled) return;
    const el = inputRef.current;
    if (!el) return;
    queueMicrotask(() => {
      el.focus();
      moverCursorAlFinal();
    });
  }, [autoFocus, disabled, moverCursorAlFinal]);

  useLayoutEffect(() => {
    moverCursorAlFinal();
  }, [value, moverCursorAlFinal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    commit(e.target.value);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    commit(e.clipboardData.getData("text"));
  };

  const segmentos = lengthMax;

  return (
    <div className={cn("relative w-full touch-manipulation", className)}>
      <div
        className={cn(
          "pointer-events-none grid w-full gap-1.5 sm:gap-2",
          invalid && "rounded-lg ring-2 ring-red-400/30 ring-offset-2 ring-offset-[rgba(3,24,47,0.5)]",
        )}
        style={{ gridTemplateColumns: `repeat(${segmentos}, minmax(0, 1fr))` }}
        aria-hidden
      >
        {Array.from({ length: segmentos }, (_, i) => (
          <div
            key={i}
            className={cn(
              "flex min-h-[3rem] select-none items-center justify-center rounded-lg border bg-black/50 font-mono text-lg font-semibold tabular-nums text-white sm:min-h-[3.35rem] sm:text-xl",
              invalid ? "border-red-400/65" : "border-white/18",
            )}
          >
            {value[i] ? (
              <span aria-hidden>{value[i]}</span>
            ) : (
              <span className="text-white/20" aria-hidden>
                ·
              </span>
            )}
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        name="one-time-code"
        maxLength={lengthMax}
        disabled={disabled}
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        aria-label={`Código numérico de ${lengthMin} a ${lengthMax} dígitos`}
        aria-invalid={invalid || undefined}
        className="absolute inset-0 z-[1] h-full w-full cursor-text opacity-0 disabled:cursor-not-allowed"
      />
    </div>
  );
}
