import type { PlaylistAportePublic } from "@/lib/spotify-credentials";

type Props = {
  items: PlaylistAportePublic[];
  /** `light`: texto marino sobre fondo claro (invitación premium). */
  variant?: "dark" | "light";
};

export function UltimasCancionesPlaylist({ items, variant = "dark" }: Props) {
  if (items.length === 0) return null;

  const isLight = variant === "light";

  return (
    <div
      className={
        isLight
          ? "mt-3 rounded-xl border border-[#1A2B48]/10 bg-white p-2.5"
          : "mt-4 rounded-xl border border-white/10 bg-black/35 p-3"
      }
    >
      <p
        className={
          isLight
            ? "text-[9px] font-bold uppercase tracking-widest text-[#1A2B48]/45"
            : "text-[10px] font-bold uppercase tracking-widest text-[#1ed760]/90"
        }
      >
        Últimos pedidos
      </p>
      <ul className="mt-2 space-y-2">
        {items.map((it, i) => (
          <li key={`${it.created_at}-${i}`} className="flex gap-2 text-sm">
            <div
              className={
                isLight
                  ? "h-10 w-10 shrink-0 overflow-hidden rounded bg-[#1A2B48]/5"
                  : "h-10 w-10 shrink-0 overflow-hidden rounded bg-zinc-800"
              }
            >
              {it.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div
                  className={`flex h-full w-full items-center justify-center text-[10px] ${isLight ? "text-[#1A2B48]/35" : "text-zinc-500"}`}
                >
                  ♪
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`truncate font-medium ${isLight ? "text-[#1A2B48]" : "text-white"}`}>
                {it.track_name ?? "Canción"}
              </p>
              <p className={`truncate text-xs ${isLight ? "text-[#1A2B48]/65" : "text-zinc-400"}`}>
                {it.artist_names ?? ""}
              </p>
              <p className={`text-[10px] ${isLight ? "text-[#1A2B48]/50" : "text-zinc-500"}`}>
                por{" "}
                <span className={isLight ? "font-medium text-[#15803d]" : "text-[#1ed760]/90"}>
                  {it.guest_first_name}
                </span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
