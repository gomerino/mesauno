"use client";

import { createClient } from "@/lib/supabase/client";
import { eventoFotoPublicUrl } from "@/lib/evento-foto-url";
import type { EventoFoto } from "@/types/database";
import Image from "next/image";
import { Download, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  eventoId: string;
  emptyHint?: string;
  allowDownload?: boolean;
  photoGroups?: { id: string; title: string; photoIds: string[] }[];
  fotos: EventoFoto[];
  setFotos: React.Dispatch<React.SetStateAction<EventoFoto[]>>;
};

export function LiveGallery({ eventoId, fotos, setFotos, allowDownload = false, photoGroups, emptyHint = "Sé el primero en compartir un momento con el botón flotante." }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
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

  async function downloadPhoto(foto: EventoFoto) {
    setDownloading(true);
    setDownloadError(null);
    setDownloaded(false);
    try {
      const response = await fetch(eventoFotoPublicUrl(foto.storage_path));
      if (!response.ok) throw new Error("download");
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = foto.storage_path.split("/").pop() || "foto-del-evento.jpg";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setDownloaded(true);
    } catch {
      setDownloadError("No pudimos descargar la foto. Intenta de nuevo.");
    } finally {
      setDownloading(false);
    }
  }

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
        <p className="mt-1 text-xs text-gray-500">{emptyHint}</p>
      </div>
    );
  }

  const assigned = new Set(photoGroups?.flatMap((group) => group.photoIds) ?? []);
  const groups = photoGroups?.length ? [
    ...photoGroups.map((group) => ({ ...group, photos: fotos.filter((foto) => group.photoIds.includes(foto.id)) })),
    { id: "otros", title: "Otros recuerdos", photos: fotos.filter((foto) => !assigned.has(foto.id)) },
  ].filter((group) => group.photos.length > 0) : [{ id: "todas", title: "", photos: fotos }];

  return (
    <>
      {groups.map((group) => <section key={group.id} aria-label={group.title || "Todas las fotos"} className={photoGroups?.length ? "mb-6" : undefined}>
      {group.title && <h3 className="mb-3 font-serif text-xl text-[#25344a]">{group.title}</h3>}
      <div className="columns-2 gap-2 sm:columns-3 sm:gap-2.5">
        {group.photos.map((f) => {
          const src = eventoFotoPublicUrl(f.storage_path);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => { setLightbox(f); setDownloadError(null); setDownloaded(false); }}
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

      </section>)}

      {lightbox ? (
        <div
          className={`fixed inset-0 z-gallery-260 flex flex-col p-2 sm:p-4 ${allowDownload ? "bg-[#101820]" : "bg-black/92"}`}
          role="dialog"
          aria-modal="true"
          aria-label="Foto en pantalla completa"
        >
          <div className={allowDownload ? "flex shrink-0 items-center justify-end gap-3 p-2" : "flex shrink-0 justify-end"}>
            {allowDownload && <button type="button" disabled={downloading} onClick={() => void downloadPhoto(lightbox)} className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl border-2 border-white bg-[#f0e8db] px-5 py-3 text-base font-bold text-[#182a3b] shadow-lg disabled:opacity-60 sm:flex-none"><Download size={20} aria-hidden />{downloading ? "Descargando…" : "Descargar foto"}</button>}
            <button
              type="button"
              onClick={closeLb}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Cerrar"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          {allowDownload && downloadError && <p role="alert" className="px-3 py-2 text-center text-white">{downloadError}</p>}
          {allowDownload && downloaded && <p role="status" className="px-3 py-2 text-center text-white">Descarga iniciada.</p>}
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
