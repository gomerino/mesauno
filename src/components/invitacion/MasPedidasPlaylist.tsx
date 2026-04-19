"use client";

import { trackEvent } from "@/lib/analytics";
import type { PlaylistTopPublic } from "@/lib/spotify-credentials";
import { useEffect, useState } from "react";

type Props = {
  items: PlaylistTopPublic[];
  apoyoTrackUris: string[];
  variant?: "dark" | "light";
  onApoyar: (trackUri: string) => Promise<{ ok: boolean; error?: string; already?: boolean }>;
};

export function MasPedidasPlaylist({ items, apoyoTrackUris, variant = "dark", onApoyar }: Props) {
  const isLight = variant === "light";
  const supported = new Set(apoyoTrackUris);

  if (items.length === 0) return null;

  return (
    <div
      className={
        isLight
          ? "mt-3 rounded-xl border border-[#1A2B48]/10 bg-white p-2.5"
          : "mt-4 rounded-xl border border-[#1ed760]/25 bg-black/30 p-3"
      }
    >
      <p
        className={
          isLight
            ? "text-[9px] font-bold uppercase tracking-widest text-[#1A2B48]/45"
            : "text-[10px] font-bold uppercase tracking-widest text-[#1ed760]/90"
        }
      >
        Las más pedidas
      </p>
      <p className={`mt-1 text-[11px] leading-snug ${isLight ? "text-[#1A2B48]/55" : "text-zinc-500"}`}>
        Cada persona cuenta una vez por canción (proponer o apoyar).
      </p>
      <ul className="mt-2 space-y-2">
        {items.map((it) => {
          const yaApoyo = supported.has(it.track_uri);
          return (
            <li
              key={it.track_uri}
              className={`flex items-center gap-2 rounded-lg border p-2 ${
                isLight ? "border-[#1A2B48]/8 bg-[#F4F1EA]/50" : "border-white/5 bg-white/5"
              }`}
            >
              <div
                className={
                  isLight
                    ? "flex h-9 min-w-[2.25rem] items-center justify-center rounded-md bg-[#15803d]/12 font-semibold text-[#15803d]"
                    : "flex h-9 min-w-[2.25rem] items-center justify-center rounded-md bg-[#1ed760]/15 text-sm font-bold text-[#1ed760]"
                }
              >
                {it.personas}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${isLight ? "text-[#1A2B48]" : "text-white"}`}>
                  {it.track_name ?? "Canción"}
                </p>
                <p className={`truncate text-xs ${isLight ? "text-[#1A2B48]/65" : "text-zinc-400"}`}>
                  {it.artist_names ?? ""}
                </p>
              </div>
              <ApoyoButton
                disabled={yaApoyo}
                isLight={isLight}
                onApoyar={async () => {
                  const r = await onApoyar(it.track_uri);
                  if (r.ok) {
                    trackEvent("playlist_track_apoyo", { source: "invitacion_top" });
                  }
                  return r;
                }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ApoyoButton({
  disabled,
  isLight,
  onApoyar,
}: {
  disabled: boolean;
  isLight: boolean;
  onApoyar: () => Promise<{ ok: boolean; error?: string; already?: boolean }>;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(disabled);

  useEffect(() => {
    setDone(disabled);
  }, [disabled]);

  return (
    <button
      type="button"
      disabled={done || loading}
      onClick={async () => {
        setLoading(true);
        try {
          const r = await onApoyar();
          if (r.ok) setDone(true);
        } finally {
          setLoading(false);
        }
      }}
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50 sm:px-3 sm:text-xs ${
        done
          ? isLight
            ? "border border-emerald-600/30 bg-emerald-50 text-emerald-800"
            : "border border-[#1ed760]/40 text-[#1ed760]/90"
          : isLight
            ? "border border-[#15803d]/40 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            : "border border-[#1ed760]/50 bg-[#1ed760]/10 text-[#1ed760] hover:bg-[#1ed760]/20"
      }`}
    >
      {loading ? "…" : done ? "Listo" : "Apoyar"}
    </button>
  );
}
