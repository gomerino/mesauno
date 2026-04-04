import type { EventPlaylistUrls } from "@/lib/event-playlist-env";
import { hasAnyPlaylist } from "@/lib/event-playlist-env";
import { spotifyPlaylistEmbedSrc, spotifyPlaylistIdFromUrl } from "@/lib/spotify";

function SpotifyRow({ url, showEmbed }: { url: string; showEmbed: boolean }) {
  const id = spotifyPlaylistIdFromUrl(url);
  const href = url.trim();

  return (
    <div className="border-t border-dashed border-gray-200">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 px-3 py-2.5 transition hover:bg-black/[0.03] sm:px-4"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1DB954] text-white shadow-sm"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-500">Spotify</p>
          <p className="truncate text-xs font-semibold text-gray-900">Abrir playlist</p>
        </div>
        <span className="shrink-0 text-lg font-light text-gray-400" aria-hidden>
          ↗
        </span>
      </a>
      {showEmbed && id && (
        <div className="border-t border-dashed border-gray-200 px-2 pb-2 pt-1">
          <iframe
            title="Playlist de Spotify"
            src={spotifyPlaylistEmbedSrc(id)}
            width="100%"
            height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-md"
          />
        </div>
      )}
    </div>
  );
}

function AppleMusicRow({ url }: { url: string }) {
  const href = url.trim();

  return (
    <div className="border-t border-dashed border-gray-200">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 px-3 py-2.5 transition hover:bg-black/[0.03] sm:px-4"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FA233B] to-[#FB5C74] text-white shadow-sm"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-500">Apple Music</p>
          <p className="truncate text-xs font-semibold text-gray-900">Abrir playlist</p>
        </div>
        <span className="shrink-0 text-lg font-light text-gray-400" aria-hidden>
          ↗
        </span>
      </a>
    </div>
  );
}

function OtherPlaylistRow({ url }: { url: string }) {
  const href = url.trim();

  return (
    <div className="border-t border-dashed border-gray-200">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 px-3 py-2.5 transition hover:bg-black/[0.03] sm:px-4"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-800 text-lg text-white shadow-sm"
          aria-hidden
        >
          ♪
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-500">Playlist</p>
          <p className="truncate text-xs font-semibold text-gray-900">Abrir enlace</p>
        </div>
        <span className="shrink-0 text-lg font-light text-gray-400" aria-hidden>
          ↗
        </span>
      </a>
    </div>
  );
}

export function EventPlaylistSection({
  spotify,
  appleMusic,
  other,
  showSpotifyEmbed,
}: EventPlaylistUrls) {
  if (!hasAnyPlaylist({ spotify, appleMusic, other, showSpotifyEmbed })) return null;

  return (
    <div className="border-t border-dashed border-gray-300 bg-white">
      <p className="px-3 pb-1 pt-2.5 text-center text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-500 sm:px-4">
        Música del evento
      </p>
      {spotify && <SpotifyRow url={spotify} showEmbed={showSpotifyEmbed} />}
      {appleMusic && <AppleMusicRow url={appleMusic} />}
      {other && <OtherPlaylistRow url={other} />}
    </div>
  );
}
