"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useCallback, useRef } from "react";

type Props = {
  /** Contenido del QR (p. ej. `qr_code_token`). */
  payload: string;
  fileName?: string;
};

/**
 * QR de check-in para el personal del venue (escaneo con la app /staff).
 */
export function InvitacionCheckInQr({ payload, fileName = "check-in-mesa-uno.png" }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const download = useCallback(() => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
  }, [fileName]);

  if (!payload?.trim()) return null;

  return (
    <div className="rounded-2xl border border-gray-300/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
        Check-in recepción
      </p>
      <p className="mt-1 text-center text-xs text-gray-600">
        Muestra este código al llegar al evento para registrar tu entrada.
      </p>
      <div ref={canvasRef} className="mt-3 flex justify-center">
        <QRCodeCanvas
          value={payload.trim()}
          size={180}
          marginSize={2}
          level="M"
          fgColor="#001d66"
          bgColor="#ffffff"
        />
      </div>
      <button
        type="button"
        onClick={download}
        className="mt-4 w-full rounded-full border border-[#001d66]/30 bg-[#001d66]/5 py-2 text-xs font-semibold text-[#001d66] transition hover:bg-[#001d66]/10"
      >
        Guardar imagen del QR
      </button>
    </div>
  );
}
