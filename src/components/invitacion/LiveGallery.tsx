"use client";

import { createClient } from "@/lib/supabase/client";
import { eventoFotoPublicUrl } from "@/lib/evento-foto-url";
import type { EventoFoto } from "@/types/database";
import Image from "next/image";
import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  eventoId: string;
  fotos: EventoFoto[];
  setFotos: React.Dispatch<React.SetStateAction<EventoFoto[]>>;
};

export function LiveGallery({ eventoId, fotos, setFotos }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [lightbox, setLightbox] = useState<EventoFoto | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`evento_fotos:${eventoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "evento_fotos",
          filter: `evento_id=eq.${eventoId}`,
        },
        (payload) => {
          const row = payload.new as EventoFoto;
          if (!row?.id) return;
          setFotos((prev) => {
            if (prev.some((p) => p.id === row.id)) return prev;
            return [row, ...prev].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [eventoId, setFotos, supabase]);

  const closeLb = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLb();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, closeLb]);

  if (fotos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#001d66]/25 bg-white/60 px-4 py-10 text-center">
        <p className="text-sm font-medium text-gray-700">Aún no hay fotos</p>
        <p className="mt-1 text-xs text-gray-500">Sé el primero en compartir un momento con el botón flotante.</p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-2 gap-2 sm:columns-3 sm:gap-2.5">
        {fotos.map((f) => {
          const src = eventoFotoPublicUrl(f.storage_path);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setLightbox(f)}
              className="group mb-2 block w-full break-inside-avoid overflow-hidden rounded-xl border border-[#001d66]/10 bg-gray-100 shadow-sm transition hover:ring-2 hover:ring-[#001d66]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#001d66]"
            >
              <div className="relative aspect-[4/5] w-full">
                <Image
                  src={src}
                  alt="Foto compartida por un invitado"
                  fill
                  className="object-cover transition group-hover:scale-[1.02]"
                  sizes="(max-width: 640px) 50vw, 33vw"
                  loading="lazy"
                />
              </div>
            </button>
          );
        })}
      </div>

      {lightbox ? (
        <div
          className="fixed inset-0 z-[260] flex flex-col bg-black/92 p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Foto en pantalla completa"
        >
          <div className="flex shrink-0 justify-end">
            <button
              type="button"
              onClick={closeLb}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Cerrar"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div
            className="relative flex min-h-0 flex-1 cursor-zoom-out items-center justify-center p-2"
            onClick={closeLb}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- lightbox: URL externa dinámica sin dimensiones fijas */}
            <img
              src={eventoFotoPublicUrl(lightbox.storage_path)}
              alt="Foto ampliada"
              className="max-h-[85dvh] max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
