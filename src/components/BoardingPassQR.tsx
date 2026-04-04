"use client";

import { QRCodeSVG } from "qrcode.react";

/** Paleta alineada con Dreams / boarding pass */
const WEDDING_FG = "#001d66";
const WEDDING_BG = "#FFFBF7";

type Props = {
  value: string;
  size?: number;
  /** Muestra corazón en el centro (requiere nivel H de corrección). */
  showWeddingHeart?: boolean;
};

export function BoardingPassQR({ value, size = 112, showWeddingHeart = true }: Props) {
  const level = showWeddingHeart ? "H" : "M";
  const imgSize = Math.max(12, Math.round(size * 0.22));

  return (
    <div className="flex w-full justify-center">
      <div
        className="relative rounded-xl bg-gradient-to-b from-[#fff9f6] via-[#FFFBF7] to-[#fff0f3] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_12px_rgba(0,29,102,0.12)] ring-2 ring-[#001d66]/15"
      >
        {/* Detalle superior tipo sello / invitación */}
        <div className="pointer-events-none absolute left-1/2 top-1.5 h-px w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-rose-300/60 to-transparent" />
        <span
          className="pointer-events-none absolute left-1 top-1/2 h-6 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-[#001d66]/20 to-transparent"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute right-1 top-1/2 h-6 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-[#001d66]/20 to-transparent"
          aria-hidden
        />

        <QRCodeSVG
          value={value}
          size={size}
          level={level}
          marginSize={1}
          fgColor={WEDDING_FG}
          bgColor={WEDDING_BG}
          title="Código QR — ubicación del evento"
          imageSettings={
            showWeddingHeart
              ? {
                  src: "/wedding-qr-heart.svg",
                  height: imgSize,
                  width: imgSize,
                  excavate: true,
                }
              : undefined
          }
          className="h-auto w-auto rounded-md"
        />
      </div>
    </div>
  );
}
