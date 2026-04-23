"use client";

import { JURNEX_BRAND } from "@/components/brand/jurnex-assets";
import clsx from "clsx";

type Props = {
  className?: string;
  /** En sidebar va vacío si hay texto al lado; en móvil solo icono usar "Jurnex". */
  alt?: string;
};

/**
 * Marca en panel: mismo logo circular PNG que en cabecera (tamaño vía `className`, p. ej. `h-6 w-6`).
 */
export function JurnexOrbitIcon({ className = "h-9 w-9", alt = "" }: Props) {
  return (
    <img
      src={JURNEX_BRAND.logos.fullPng}
      alt={alt}
      width={1024}
      height={1024}
      className={clsx("shrink-0 object-contain", className)}
      decoding="async"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}
