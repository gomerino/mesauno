"use client";

import { createClient } from "@/lib/supabase/client";
import type { MusicaFiestaEstadoRespuesta } from "@/lib/musica-fiesta-en-vivo";
import { useCallback, useEffect, useState } from "react";

type Params = {
  eventoId: string;
  /** Vacío en panel (sesión). */
  invitacionToken?: string;
  /** Token para consola DJ pública (`/dj/...`). */
  djAcceso?: string;
  enabled: boolean;
  /** Solo sesión en panel; las invitaciones usan polling. */
  usarRealtime?: boolean;
  pollMs?: number;
};

export function useMusicaFiestaEstado({
  eventoId,
  invitacionToken = "",
  djAcceso = "",
  enabled,
  usarRealtime = false,
  pollMs = 5000,
}: Params) {
  const [data, setData] = useState<MusicaFiestaEstadoRespuesta | null>(null);
  const token = invitacionToken.trim();
  const djTok = djAcceso.trim();
  const esInvitacion = Boolean(token);
  const esDjPublico = Boolean(djTok);

  const cargar = useCallback(async () => {
    if (!eventoId || !enabled) return;
    try {
      const p = new URLSearchParams({ evento_id: eventoId });
      if (token) p.set("invitacion_token", token);
      if (djTok) p.set("dj_acceso", djTok);
      const res = await fetch(`/api/musica/fiesta/estado?${p.toString()}`, {
        cache: "no-store",
        credentials: esInvitacion || esDjPublico ? "same-origin" : "include",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      if (!res.ok) return;
      const json = (await res.json()) as MusicaFiestaEstadoRespuesta;
      setData(json);
    } catch {
      /* fallback silencioso; el siguiente poll reintenta */
    }
  }, [eventoId, enabled, token, djTok, esInvitacion, esDjPublico]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!enabled || pollMs <= 0) return;
    const id = window.setInterval(() => void cargar(), pollMs);
    return () => window.clearInterval(id);
  }, [enabled, pollMs, cargar]);

  useEffect(() => {
    if (!enabled || !usarRealtime || !eventoId || esInvitacion || esDjPublico) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`musica-fiesta-aportes-${eventoId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "aportes_canciones",
          filter: `evento_id=eq.${eventoId}`,
        },
        () => void cargar()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, usarRealtime, eventoId, esInvitacion, esDjPublico, cargar]);

  return { data, reload: cargar };
}
