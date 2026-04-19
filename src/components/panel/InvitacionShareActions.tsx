"use client";

import { CopyInviteLinkButton } from "@/components/dashboard/CopyInviteLinkButton";
import { buildInvitationUrl } from "@/lib/invitation-url";
import { trackEvent } from "@/lib/analytics";
import { useEffect, useMemo, useRef } from "react";

type Props = {
  tokenAcceso: string;
  invitadoId: string;
  invitadoNombre?: string | null;
  /** Contexto para distinguir la métrica `invite_preview_opened`. */
  source?: string;
};

/**
 * Acciones de compartir sobre un invitado (copy + abrir pública).
 *
 * Dispara `invite_preview_opened` una sola vez por sesión y por invitado,
 * y expone un botón de copiar link junto con un enlace para ver la invitación
 * tal como la recibirá el invitado.
 */
export function InvitacionShareActions({
  tokenAcceso,
  invitadoId,
  invitadoNombre,
  source = "vista_previa",
}: Props) {
  const emittedRef = useRef<string | null>(null);
  const invitationUrl = useMemo(() => buildInvitationUrl(tokenAcceso), [tokenAcceso]);

  useEffect(() => {
    const key = `${source}:${invitadoId}`;
    if (emittedRef.current === key) return;
    emittedRef.current = key;
    if (typeof window === "undefined") return;
    const storageKey = `jx:invite_preview_opened:${key}`;
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // sessionStorage puede no estar disponible (modo privado, SSR client).
    }
    trackEvent("invite_preview_opened", {
      source,
      has_invitado_id: true,
    });
  }, [invitadoId, source]);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <CopyInviteLinkButton
        tokenAcceso={tokenAcceso}
        source={source}
        invitadoId={invitadoId}
        size="md"
      />
      <a
        href={invitationUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={invitadoNombre ? `Abrir la invitación pública de ${invitadoNombre}` : "Abrir la invitación pública"}
        onClick={() =>
          trackEvent("invite_public_opened", {
            source,
            has_invitado_id: true,
          })
        }
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
      >
        <svg
          className="h-4 w-4 shrink-0 text-slate-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M14 3h7v7" />
          <path d="M10 14L21 3" />
          <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
        </svg>
        Ver pública
      </a>
    </div>
  );
}
