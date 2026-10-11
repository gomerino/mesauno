"use client";

import { INVITACION_FOTO_SUBIDA_EVENT } from "@/lib/invitacion-foto-upload-client";
import type { EventoFoto } from "@/types/database";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { LiveGallery } from "./LiveGallery";
import { PhotoUpload } from "./PhotoUpload";

type Props = {
  eventoId: string;
  invitacionToken: string;
  initialFotos: EventoFoto[];
  /** Desplaza el FAB de fotos hacia arriba (tema premium con barra inferior). */
  photoFabBottomExtra?: string;
  /** Clases extra para la tarjeta del álbum. */
  albumCardClassName?: string;
  /** Si true, no renderiza la cuadrícula (p. ej. tema premium con carrusel propio). */
  omitInnerGallery?: boolean;
  /** Estado controlado de fotos (tema premium + carrusel externo). */
  fotos?: EventoFoto[];
  setFotos?: Dispatch<SetStateAction<EventoFoto[]>>;
  albumTitle?: string;
  albumBlurb?: string;
  presentation?: "default" | "editorial";
  showUpload?: boolean;
  allowDownload?: boolean;
  photoGroups?: { id: string; title: string; photoIds: string[] }[];
};

export function InvitacionAlbumSection({
  eventoId,
  invitacionToken,
  initialFotos,
  photoFabBottomExtra,
  albumCardClassName,
  omitInnerGallery,
  fotos: fotosProp,
  setFotos: setFotosProp,
  presentation = "default", showUpload = true, allowDownload = false, photoGroups,
  albumTitle = "Álbum compartido",
  albumBlurb = "Sube fotos desde tu celular durante el evento. La galería se actualiza en vivo para todos los invitados.",
}: Props) {
  const [internal, setInternal] = useState<EventoFoto[]>(initialFotos);
  const controlled = fotosProp != null && setFotosProp != null;
  const fotos = controlled ? fotosProp : internal;
  const setFotos = controlled ? setFotosProp : setInternal;

  useEffect(() => {
    if (!controlled) setInternal(initialFotos);
  }, [initialFotos, controlled]);

  useEffect(() => {
    const onSubida = (ev: Event) => {
      const ce = ev as CustomEvent<{ foto?: EventoFoto }>;
      const foto = ce.detail?.foto;
      if (!foto || (presentation === "editorial" && foto.evento_id !== eventoId)) return;
      setFotos((prev) => {
        if (prev.some((p) => p.id === foto.id)) return prev;
        return [foto, ...prev].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    };
    window.addEventListener(INVITACION_FOTO_SUBIDA_EVENT, onSubida as EventListener);
    return () => window.removeEventListener(INVITACION_FOTO_SUBIDA_EVENT, onSubida as EventListener);
  }, [setFotos, presentation, eventoId]);

  const onUploaded = (foto: EventoFoto) => setFotos(previous => {
    if (presentation === "editorial" && foto.evento_id !== eventoId) return previous;
    if (previous.some(item => item.id === foto.id)) return previous;
    return [foto, ...previous].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });

  if (presentation === "editorial") return <section aria-label="Fotos del evento" className={albumCardClassName}>
    <h2>{albumTitle}</h2><p>{albumBlurb}</p>
    <div className="grid gap-3 my-5">
      {showUpload && <PhotoUpload invitacionToken={invitacionToken} presentation="inline" buttonLabel="Compartir mis fotos" buttonClassName="editorial-photo-action" onUploaded={onUploaded} />}
      <a className="editorial-photo-link" href="#editorial-live-gallery">Ver fotos del evento</a>
    </div>
    <div id="editorial-live-gallery" tabIndex={-1}><LiveGallery editorial eventoId={eventoId} fotos={fotos} setFotos={setFotos} allowDownload={allowDownload} photoGroups={photoGroups} emptyHint="Aquí aparecerán los recuerdos compartidos por los invitados." /></div>
  </section>;


  return (
    <section
      className="relative mb-2"
      aria-labelledby="album-fotos-titulo"
    >
      <div
        className={
          albumCardClassName ??
          "mb-3 rounded-xl border border-[#001d66]/20 bg-gradient-to-br from-white to-[#f8f9ff] p-4 shadow-[0_2px_16px_rgba(0,29,102,0.08)] sm:p-5"
        }
      >
        <h2 id="album-fotos-titulo" className="font-display text-base font-bold text-[#001d66] sm:text-lg">
          {albumTitle}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-gray-600 sm:text-sm">{albumBlurb}</p>
        {!omitInnerGallery ? (
          <div className="mt-4">
            <LiveGallery eventoId={eventoId} fotos={fotos} setFotos={setFotos} />
          </div>
        ) : (
          <p className="mt-3 text-center text-xs text-invite-navy/55">
            Desliza la bitácora de arriba o sube una foto con el botón flotante.
          </p>
        )}
      </div>

      <PhotoUpload
        invitacionToken={invitacionToken}
        fabBottomExtra={photoFabBottomExtra}
        onUploaded={onUploaded}
      />
    </section>
  );
}
