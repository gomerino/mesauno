"use client";

import { buildInvitationUrl } from "@/lib/invitation-url";
import { trackEvent } from "@/lib/analytics";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  tokenAcceso: string;
  invitadoId: string;
  invitadoNombre?: string | null;
  /** Forzar un tema vía querystring (override visual sin tocar la DB). */
  previewThemeId?: "legacy" | "soft-aviation" | null;
};

/**
 * Renderiza la landing pública `/invitacion/[token]` dentro de un iframe, preservando
 * la apariencia real que verá el invitado. Usa `sandbox` amplio para que el contenido
 * siga siendo navegable (mapas, embeds, scroll).
 */
export function InvitacionFullPreview({
  tokenAcceso,
  invitadoId,
  invitadoNombre,
  previewThemeId,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const emittedRef = useRef(false);

  const src = useMemo(() => {
    const base = buildInvitationUrl(tokenAcceso);
    const q = new URLSearchParams();
    q.set("previewFromPanel", "1");
    if (previewThemeId) q.set("theme", previewThemeId);
    return `${base}?${q.toString()}`;
  }, [tokenAcceso, previewThemeId]);

  useEffect(() => {
    if (emittedRef.current) return;
    emittedRef.current = true;
    trackEvent("invite_preview_opened", {
      source: "vista_previa_full",
      has_invitado_id: true,
    });
  }, [invitadoId]);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="relative w-full max-w-[460px] overflow-hidden rounded-[28px] border border-white/10 bg-black/60 shadow-xl">
        {/* Barra tipo navegador mobile */}
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.03] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          <span>Vista previa</span>
          <span className="truncate" aria-hidden>
            {invitadoNombre ? `Para ${invitadoNombre}` : "Invitación"}
          </span>
        </div>
        {!loaded && (
          <div
            aria-hidden
            className="absolute inset-x-0 top-8 flex h-[640px] items-center justify-center bg-black/30 text-xs text-slate-400"
          >
            Cargando invitación…
          </div>
        )}
        <iframe
          key={src}
          src={src}
          title={invitadoNombre ? `Invitación de ${invitadoNombre}` : "Invitación"}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className="block h-[640px] w-full bg-black"
        />
      </div>
      <p className="max-w-xs text-center text-[11px] text-slate-500">
        Así se ve la invitación completa. Desplazate dentro del marco para revisar todo el contenido.
      </p>
    </div>
  );
}
