"use client";

import { disconnectSpotifyAction, saveSpotifyPlaylistIdAction } from "@/app/panel/actions/spotify";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const label = "block text-xs font-medium text-slate-400";
const input =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none ring-green-500 focus:ring-2";

type Props = {
  eventoId: string;
  spotifyConnected: boolean;
  initialPlaylistId: string | null;
};

export function SpotifyPlaylistConnect({ eventoId, spotifyConnected, initialPlaylistId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [playlistInput, setPlaylistInput] = useState(initialPlaylistId ?? "");
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const flashHandled = useRef(false);

  useEffect(() => {
    if (flashHandled.current) return;
    if (searchParams.get("spotify") === "connected") {
      flashHandled.current = true;
      toast.success("Cuenta de Spotify vinculada. Ahora indica la playlist oficial.");
      router.replace("/panel/evento");
      return;
    }
    const err = searchParams.get("spotify_error");
    if (err) {
      flashHandled.current = true;
      toast.error(decodeURIComponent(err));
      router.replace("/panel/evento");
    }
  }, [searchParams, router]);

  async function savePlaylist(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await saveSpotifyPlaylistIdAction(eventoId, playlistInput);
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error ?? "Error al guardar");
      return;
    }
    toast.success("Playlist guardada");
    router.refresh();
  }

  async function disconnect() {
    setDisconnecting(true);
    const res = await disconnectSpotifyAction(eventoId);
    setDisconnecting(false);
    if (!res.ok) {
      toast.error(res.error ?? "Error");
      return;
    }
    toast.success("Spotify desvinculado");
    setPlaylistInput("");
    router.refresh();
  }

  const authUrl = `/api/spotify/authorize?evento_id=${encodeURIComponent(eventoId)}`;

  return (
    <section className="space-y-4 rounded-2xl border border-green-500/25 bg-gradient-to-br from-green-950/40 to-black/40 p-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-green-400">Música colaborativa (Spotify)</h2>
        <p className="mt-1 text-sm text-slate-400">
          Los invitados podrán buscar canciones y sumarlas a una playlist. Primero autoriza a Mesa Uno con tu cuenta de
          Spotify (solo el administrador), luego pega el enlace de la playlist oficial.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={authUrl}
          className="inline-flex rounded-full bg-[#1DB954] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#1ed760]"
        >
          {spotifyConnected ? "Volver a autorizar Spotify" : "Vincular Spotify"}
        </a>
        {spotifyConnected && (
          <span className="text-xs font-medium text-green-300/90">Cuenta conectada</span>
        )}
      </div>

      <form onSubmit={savePlaylist} className="space-y-3">
        <div>
          <label className={label}>Enlace o ID de la playlist oficial</label>
          <input
            className={input}
            value={playlistInput}
            onChange={(e) => setPlaylistInput(e.target.value)}
            placeholder="https://open.spotify.com/playlist/…"
            disabled={!spotifyConnected}
          />
          {!spotifyConnected && (
            <p className="mt-1 text-xs text-slate-500">Conecta Spotify antes de guardar la playlist.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={!spotifyConnected || saving}
            className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-40"
          >
            {saving ? "Guardando…" : "Guardar playlist"}
          </button>
          {spotifyConnected && (
            <button
              type="button"
              disabled={disconnecting}
              onClick={() => void disconnect()}
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              Desvincular Spotify
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
