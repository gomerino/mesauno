"use client";

import { buildInvitationUrl } from "@/lib/invitation-url";
import { trackEvent } from "@/lib/analytics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Size = "sm" | "md";

type Props = {
  tokenAcceso: string;
  /** Contexto de uso para distinguir métricas (ej. "invitados_list", "vista_previa"). */
  source: string;
  /** Opcional: id del invitado para telemetría (no PII). */
  invitadoId?: string | null;
  size?: Size;
  className?: string;
  /** Texto del botón en estado idle. Default: "Copiar link". */
  label?: string;
};

function LinkGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 1 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 1 0 7.07 7.07l1.5-1.5" />
    </svg>
  );
}

function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function CopyInviteLinkButton({
  tokenAcceso,
  source,
  invitadoId,
  size = "sm",
  className,
  label = "Copiar link",
}: Props) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const invitationUrl = useMemo(() => buildInvitationUrl(tokenAcceso), [tokenAcceso]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setError(false);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(invitationUrl);
      } else if (typeof window !== "undefined") {
        // Fallback mobile/legacy Safari.
        const ta = document.createElement("textarea");
        ta.value = invitationUrl;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      trackEvent("invite_link_copied", {
        source,
        method: "copy",
        has_invitado_id: Boolean(invitadoId),
      });
      timerRef.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      setError(true);
      timerRef.current = setTimeout(() => setError(false), 2500);
    }
  }, [invitationUrl, source, invitadoId]);

  const sizeCls =
    size === "md"
      ? "px-4 py-2 text-sm"
      : "px-3 py-1.5 text-xs";
  const iconCls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

  const stateCls = copied
    ? "border-emerald-600/50 bg-emerald-900/40 text-emerald-200 hover:bg-emerald-900/55"
    : error
      ? "border-orange-500/40 bg-orange-900/30 text-orange-200"
      : "border-sky-500/30 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-live="polite"
      title={copied ? "Link copiado al portapapeles" : "Copiar link de invitación"}
      className={[
        "inline-flex items-center gap-1.5 rounded-full border font-semibold shadow-sm transition",
        sizeCls,
        stateCls,
        className ?? "",
      ].join(" ")}
    >
      {copied ? (
        <CheckGlyph className={`${iconCls} shrink-0 text-emerald-300`} />
      ) : (
        <LinkGlyph className={`${iconCls} shrink-0`} />
      )}
      {copied ? "Copiado" : error ? "Reintenta" : label}
    </button>
  );
}
