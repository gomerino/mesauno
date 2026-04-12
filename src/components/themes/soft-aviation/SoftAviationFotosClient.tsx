"use client";

import { InvitacionAlbumSection } from "@/components/invitacion/InvitacionAlbumSection";
import { SoftAviationPolaroidStrip } from "@/components/themes/soft-aviation/SoftAviationPolaroidStrip";
import type { EventoFoto } from "@/types/database";
import { useEffect, useState } from "react";

type Props = {
  eventoId: string;
  invitacionToken: string;
  initialFotos: EventoFoto[];
  photoFabBottomExtra?: string;
  albumCardClassName?: string;
  /** Cuando true, no añade `<section>` externa (p. ej. dentro de pestañas). */
  hideOuterSection?: boolean;
  albumTitle?: string;
  albumBlurb?: string;
};

export function SoftAviationFotosClient({
  eventoId,
  invitacionToken,
  initialFotos,
  photoFabBottomExtra,
  albumCardClassName,
  hideOuterSection,
  albumTitle,
  albumBlurb,
}: Props) {
  const [fotos, setFotos] = useState<EventoFoto[]>(initialFotos);

  useEffect(() => {
    setFotos(initialFotos);
  }, [initialFotos]);

  const inner = (
    <>
      <SoftAviationPolaroidStrip eventoId={eventoId} fotos={fotos} setFotos={setFotos} compact={hideOuterSection} />
      <InvitacionAlbumSection
        eventoId={eventoId}
        invitacionToken={invitacionToken}
        initialFotos={initialFotos}
        fotos={fotos}
        setFotos={setFotos}
        omitInnerGallery
        photoFabBottomExtra={photoFabBottomExtra}
        albumCardClassName={albumCardClassName}
        albumTitle={albumTitle ?? "Bitácora compartida"}
        albumBlurb={
          albumBlurb ??
          "Captura el día en vivo. Las fotos aparecen aquí y puedes sumar la tuya con el botón de la cámara."
        }
      />
    </>
  );

  if (hideOuterSection) {
    return <div className="flex flex-col gap-5">{inner}</div>;
  }

  return <section className="mt-10">{inner}</section>;
}
