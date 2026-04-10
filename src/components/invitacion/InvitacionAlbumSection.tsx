"use client";

import type { EventoFoto } from "@/types/database";
import { useEffect, useState } from "react";
import { LiveGallery } from "./LiveGallery";
import { PhotoUpload } from "./PhotoUpload";

type Props = {
  eventoId: string;
  invitacionToken: string;
  initialFotos: EventoFoto[];
};

export function InvitacionAlbumSection({ eventoId, invitacionToken, initialFotos }: Props) {
  const [fotos, setFotos] = useState<EventoFoto[]>(initialFotos);

  useEffect(() => {
    setFotos(initialFotos);
  }, [initialFotos]);

  return (
    <section
      className="relative mb-2"
      aria-labelledby="album-fotos-titulo"
    >
      <div className="mb-3 rounded-xl border border-[#001d66]/20 bg-gradient-to-br from-white to-[#f8f9ff] p-4 shadow-[0_2px_16px_rgba(0,29,102,0.08)] sm:p-5">
        <h2 id="album-fotos-titulo" className="font-display text-base font-bold text-[#001d66] sm:text-lg">
          Álbum compartido
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-gray-600 sm:text-sm">
          Sube fotos desde tu celular durante el evento. La galería se actualiza en vivo para todos los invitados.
        </p>
        <div className="mt-4">
          <LiveGallery eventoId={eventoId} fotos={fotos} setFotos={setFotos} />
        </div>
      </div>

      <PhotoUpload
        invitacionToken={invitacionToken}
        onUploaded={(foto) =>
          setFotos((prev) => {
            if (prev.some((p) => p.id === foto.id)) return prev;
            return [foto, ...prev].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          })
        }
      />
    </section>
  );
}
