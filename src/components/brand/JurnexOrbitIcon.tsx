"use client";

import { JURNEX_BRAND } from "@/components/brand/jurnex-assets";

type Props = {
  className?: string;
  /** En sidebar va vacío si hay texto al lado; en móvil solo icono usar "Jurnex". */
  alt?: string;
};

/**
 * Icono de marca (avión + órbita). Si el SVG no carga, se oculta el nodo para no mostrar imagen rota.
 */
export function JurnexOrbitIcon({ className = "h-6 w-6 shrink-0", alt = "" }: Props) {
  return (
    <img
      src={JURNEX_BRAND.logos.icon}
      alt={alt}
      width={48}
      height={48}
      className={className}
      decoding="async"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}
