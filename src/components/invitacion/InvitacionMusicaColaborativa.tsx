"use client";

import { addTrackToPlaylist, type TrackMeta } from "@/app/invitacion/music-actions";
import type { PlaylistAportePublic } from "@/lib/spotify-credentials";
import { UltimasCancionesPlaylist } from "@/components/invitacion/UltimasCancionesPlaylist";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Props = {
  invitationAccessToken: string;
  initialRecent: PlaylistAportePublic[];
  /** `light`: tarjeta clara y texto marino (tema SoftAviation). Por defecto bloque oscuro estilo Spotify. */
  surface?: "dark" | "light";
};

type ApiTrack = {
  uri: string;
  name: string;
  artists: string;
  album: string;
  imageUrl: string | null;
};

export function InvitacionMusicaColaborativa({
  invitationAccessToken,
  initialRecent,
  surface = "dark",
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [results, setResults] = useState<ApiTrack[]>([]);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const light = surface === "light";

  const search = useCallback(async () => {
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
      const data = (await res.json()) as { tracks?: ApiTrack[]; error?: string };
      if (!res.ok) {
        setResults([]);
        setMsg({ type: "err", text: data.error ?? "No se pudo buscar" });
        return;
      }
      setResults(data.tracks ?? []);
    } catch {
      setResults([]);
      setMsg({ type: "err", text: "Error de red" });
    } finally {
      setLoading(false);
    }
  }, [q]);

  async function onAdd(track: ApiTrack) {
    setAdding(track.uri);
    setMsg(null);
    const meta: TrackMeta = {
      uri: track.uri,
      name: track.name,
      artists: track.artists,
      album: track.album,
      imageUrl: track.imageUrl,
    };
    const res = await addTrackToPlaylist(invitationAccessToken, meta);
    setAdding(null);
    if (!res.ok) {
      setMsg({ type: "err", text: res.error });
      return;
    }
    setMsg({ type: "ok", text: "¡Añadida a la playlist de los novios!" });
    router.refresh();
  }

  return (
    <div
      className={
        light
          ? "rounded-2xl border border-[#1A2B48]/10 bg-[#F4F1EA]/60 p-3 shadow-sm"
          : "mt-5 rounded-2xl border border-[#1ed760]/35 bg-gradient-to-b from-[#0d0d0d] via-[#121212] to-[#0a0a0a] p-4 shadow-[0_0_40px_-12px_rgba(30,215,96,0.35)]"
      }
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-lg ${light ? "bg-[#1DB954] text-[#1A2B48]" : "bg-[#1DB954] text-black"}`}
        >
          ♫
        </span>
        <div>
          <h2
            className={`text-base font-bold tracking-tight ${light ? "font-inviteSerif font-semibold text-[#1A2B48]" : "font-display text-white"}`}
          >
            Música colaborativa
          </h2>
          <p className={`text-xs ${light ? "text-[#1A2B48]/65" : "text-zinc-400"}`}>
            Sugiere canciones para la fiesta — se añaden a la playlist oficial.
          </p>
        </div>
      </div>

      <UltimasCancionesPlaylist items={initialRecent} variant={light ? "light" : "dark"} />

      <div className="mt-3 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void search())}
          placeholder="Buscar en Spotify…"
          className={
            light
              ? "min-w-0 flex-1 rounded-full border border-[#1A2B48]/15 bg-white px-3 py-2 text-sm text-[#1A2B48] placeholder:text-[#1A2B48]/40 focus:border-[#1ed760]/50 focus:outline-none focus:ring-1 focus:ring-[#1ed760]/35"
              : "min-w-0 flex-1 rounded-full border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-[#1ed760]/50 focus:outline-none focus:ring-1 focus:ring-[#1ed760]/40"
          }
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => void search()}
          className="shrink-0 rounded-full bg-[#1DB954] px-3 py-2 text-xs font-bold text-[#1A2B48] hover:bg-[#1ed760] disabled:opacity-50 sm:px-4 sm:text-sm"
        >
          {loading ? "…" : "Buscar"}
        </button>
      </div>

      {msg && (
        <p
          className={`mt-2 text-sm ${msg.type === "ok" ? (light ? "text-emerald-700" : "text-[#1ed760]") : light ? "text-red-700" : "text-red-300"}`}
          role="status"
        >
          {msg.text}
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
          {results.map((t) => (
            <li
              key={t.uri}
              className={`flex items-center gap-3 rounded-xl border p-2 ${
                light ? "border-[#1A2B48]/8 bg-white" : "border-white/5 bg-white/5"
              }`}
            >
              <div
                className={`h-12 w-12 shrink-0 overflow-hidden rounded-md ${light ? "bg-[#1A2B48]/5" : "bg-zinc-800"}`}
              >
                {t.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div
                    className={`flex h-full w-full items-center justify-center ${light ? "text-[#1A2B48]/35" : "text-zinc-600"}`}
                  >
                    ♪
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${light ? "text-[#1A2B48]" : "text-white"}`}>{t.name}</p>
                <p className={`truncate text-xs ${light ? "text-[#1A2B48]/65" : "text-zinc-400"}`}>{t.artists}</p>
                <p className={`truncate text-[10px] ${light ? "text-[#1A2B48]/50" : "text-zinc-500"}`}>{t.album}</p>
              </div>
              <button
                type="button"
                disabled={adding === t.uri}
                onClick={() => void onAdd(t)}
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50 sm:px-3 sm:text-xs ${
                  light
                    ? "border-[#15803d]/40 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    : "border-[#1ed760]/50 bg-[#1ed760]/10 text-[#1ed760] hover:bg-[#1ed760]/20"
                }`}
              >
                {adding === t.uri ? "…" : "Añadir"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
