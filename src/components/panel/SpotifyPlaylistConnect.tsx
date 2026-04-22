"use client";

import { disconnectSpotifyAction, saveSpotifyPlaylistIdAction } from "@/app/panel/actions/spotify";
import { panelBtnGhost, panelBtnPrimary, panelBtnSecondary } from "@/components/panel/ds";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const label = "block text-xs font-medium text-white/50";
const input =
  "mt-1 w-full rounded-lg border border-emerald-400/20 bg-black/20 px-3 py-2 text-sm text-white outline-none ring-emerald-500/40 focus:ring-2";

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
      toast.success("Cuenta de Spotify vinculada. Si no había playlist, creamos una oficial automáticamente.");
      router.replace("/panel/viaje#musica-spotify");
      return;
    }
    const err = searchParams.get("spotify_error");
    if (err) {
      flashHandled.current = true;
      toast.error(decodeURIComponent(err));
      router.replace("/panel/viaje#musica-spotify");
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

  const authUrl = `/api/auth/spotify/authorize?evento_id=${encodeURIComponent(eventoId)}`;

  return (
    <section className="space-y-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
      <div>
        <h2 className="font-display text-base font-semibold text-white/90">Música colaborativa (Spotify)</h2>
        <p className="mt-1 text-xs leading-relaxed text-white/55">
          Los invitados podrán buscar canciones y sumarlas a la playlist oficial. Al vincular tu cuenta creamos una
          playlist &quot;Boda: …&quot; automáticamente; puedes reemplazarla pegando otro enlace si prefieres una lista
          existente.
        </p>
        <details className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left text-xs text-white/50">
          <summary className="cursor-pointer font-medium text-white/70">
            Si los invitados ven error al añadir canciones (403)
          </summary>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 leading-relaxed text-white/45">
            <li>
              En{" "}
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-300/90 underline underline-offset-2 hover:text-emerald-200"
              >
                Spotify for Developers
              </a>
              , abre tu app → <strong className="text-white/75">Users and access</strong> y añade el correo de la
              misma cuenta de Spotify que vinculaste (modo desarrollo).
            </li>
            <li>
              La playlist debe ser <strong className="text-white/75">de esa cuenta</strong> (o la que creó la app al
              conectar). Listas de otro usuario o solo de lectura suelen fallar.
            </li>
            <li>
              Pulsa <strong className="text-white/75">Volver a autorizar Spotify</strong> arriba y guarda de nuevo el
              enlace de la playlist si la cambiaste.
            </li>
          </ol>
        </details>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={authUrl}
          className={`${panelBtnPrimary} rounded-full px-5 py-2.5 !bg-emerald-500/90 !text-black hover:!bg-emerald-400`}
        >
          {spotifyConnected ? "Volver a autorizar Spotify" : "Vincular Spotify"}
        </a>
        {spotifyConnected ? (
          <span className="text-xs font-medium text-emerald-200/80">Cuenta conectada</span>
        ) : null}
      </div>

      <form onSubmit={savePlaylist} className="space-y-3">
        <div>
          <label className={label}>Otra playlist (enlace o ID, opcional)</label>
          <input
            className={input}
            value={playlistInput}
            onChange={(e) => setPlaylistInput(e.target.value)}
            placeholder="https://open.spotify.com/playlist/…"
            disabled={!spotifyConnected}
          />
          {!spotifyConnected && (
            <p className="mt-1 text-xs text-white/40">Conecta Spotify antes de guardar la playlist.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={!spotifyConnected || saving}
            className={`${panelBtnSecondary} rounded-full px-5 py-2 text-sm font-medium text-white/90`}
          >
            {saving ? "Guardando…" : "Guardar enlace de playlist"}
          </button>
          {spotifyConnected ? (
            <button
              type="button"
              disabled={disconnecting}
              onClick={() => void disconnect()}
              className={`${panelBtnGhost} rounded-full border border-white/10 px-4 py-2 text-sm`}
            >
              Desvincular Spotify
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
