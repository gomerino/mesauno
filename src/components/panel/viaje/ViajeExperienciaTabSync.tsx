"use client";

import { useEventoCentroTab } from "@/components/panel/evento/EventoCentroTabContext";
import { useEffect } from "react";

/**
 * El contenido de la pestaña Experiencia (programa, Spotify, etc.) solo se renderiza con `tab === "experiencia"`.
 * OAuth y enlaces usan `#musica-spotify` o `?spotify=` sin `?tab=experiencia`, y la UI quedaba en Tripulación.
 */
export function ViajeExperienciaTabSync() {
  const ctx = useEventoCentroTab();

  useEffect(() => {
    if (!ctx || ctx.tab === "experiencia") return;
    const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    const needsExperienciaHash = hash === "musica-spotify";
    let needsExperiencia = needsExperienciaHash;
    if (!needsExperiencia && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      needsExperiencia =
        url.searchParams.has("spotify") || url.searchParams.has("spotify_error");
    }
    if (needsExperiencia) {
      ctx.setTab("experiencia");
    }
  }, [ctx]);

  return null;
}
