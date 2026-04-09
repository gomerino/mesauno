import type { PlaylistAportePublic } from "@/lib/spotify-credentials";

type Props = {
  items: PlaylistAportePublic[];
};

export function UltimasCancionesPlaylist({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-black/35 p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#1ed760]/90">Recién sumadas</p>
      <ul className="mt-2 space-y-2">
        {items.map((it, i) => (
          <li key={`${it.created_at}-${i}`} className="flex gap-2 text-sm">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-zinc-800">
              {it.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-500">♪</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{it.track_name ?? "Canción"}</p>
              <p className="truncate text-xs text-zinc-400">{it.artist_names ?? ""}</p>
              <p className="text-[10px] text-zinc-500">
                por <span className="text-[#1ed760]/90">{it.guest_first_name}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
