"use client";

import type { EventoFoto } from "@/types/database";
import imageCompression from "browser-image-compression";
import { Camera } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  invitacionToken: string;
  onUploaded: (foto: EventoFoto) => void;
  /** Suma al `bottom` del FAB (p. ej. barra fija de check-in encima). Ej: `5.25rem`. */
  fabBottomExtra?: string;
};

function uploadFormDataWithProgress(
  formData: FormData,
  onProgress: (pct: number) => void
): Promise<{ ok: boolean; status: number; body: unknown }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/invitacion/fotos");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.min(100, Math.round((100 * e.loaded) / e.total)));
      }
    };
    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText) as unknown;
      } catch {
        body = null;
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body });
    };
    xhr.onerror = () => resolve({ ok: false, status: 0, body: null });
    xhr.send(formData);
  });
}

export function PhotoUpload({ invitacionToken, onUploaded, fabBottomExtra }: Props) {
  const inputId = useId();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [compressPct, setCompressPct] = useState<number | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !invitacionToken) return;

      setErr(null);
      setBusy(true);
      setUploadPct(0);
      setCompressPct(8);

      try {
        setCompressPct(12);
        const compressed = await imageCompression(file, {
          maxSizeMB: 1.2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.82,
          fileType: "image/jpeg",
        });
        setCompressPct(100);

        const formData = new FormData();
        formData.append("token", invitacionToken);
        formData.append("file", compressed, "foto.jpg");

        const res = await uploadFormDataWithProgress(formData, (p) => setUploadPct(p));

        if (!res.ok) {
          const msg =
            typeof res.body === "object" && res.body !== null && "error" in res.body
              ? String((res.body as { error?: string }).error)
              : "No se pudo subir la foto";
          setErr(msg || `Error ${res.status}`);
          return;
        }

        const body = res.body as { ok?: boolean; foto?: EventoFoto };
        if (body?.ok && body.foto) {
          onUploaded(body.foto);
        } else {
          setErr("Respuesta inesperada del servidor");
        }
      } catch (ce) {
        setErr(ce instanceof Error ? ce.message : "Error al procesar la imagen");
      } finally {
        setBusy(false);
        setCompressPct(null);
        setUploadPct(0);
      }
    },
    [invitacionToken, onUploaded]
  );

  const showBar = busy && (compressPct !== null || uploadPct > 0);

  const bottomExpr = fabBottomExtra
    ? `calc(max(1.25rem, env(safe-area-inset-bottom, 0px)) + ${fabBottomExtra})`
    : "max(1.25rem, env(safe-area-inset-bottom, 0px))";

  const shell = (
    <div
      className="pointer-events-none fixed z-[200] flex flex-col items-end gap-2"
      style={{
        bottom: bottomExpr,
        right: "max(1.25rem, env(safe-area-inset-right, 0px))",
      }}
    >
      {err ? (
        <div className="pointer-events-auto max-w-[min(100vw-2rem,18rem)] rounded-xl border border-red-200 bg-white px-3 py-2 text-xs text-red-800 shadow-lg">
          {err}
        </div>
      ) : null}

      {showBar ? (
        <div className="pointer-events-auto w-[min(100vw-2rem,14rem)] rounded-full border border-[#001d66]/20 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
          <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[#001d66]/80">
            {compressPct !== null && compressPct < 100 ? "Comprimiendo…" : "Subiendo…"}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-[#001d66]/10">
            <div
              className="h-full rounded-full bg-[#001d66] transition-[width] duration-150"
              style={{
                width: `${compressPct !== null && compressPct < 100 ? Math.max(8, compressPct * 0.3) : uploadPct}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {/* <label htmlFor> abre el selector de archivos/cámara de forma nativa (iOS/Android); evita click() programático bloqueado */}
      <label
        htmlFor={inputId}
        className={`pointer-events-auto flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[#001d66] text-white shadow-[0_6px_24px_rgba(0,29,102,0.45)] ring-4 ring-white/90 transition hover:bg-[#002a8c] hover:shadow-xl ${
          busy ? "pointer-events-none opacity-60" : ""
        }`}
        aria-label="Subir foto al álbum del evento"
      >
        <Camera className="h-7 w-7" strokeWidth={2} />
      </label>

      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,.heic"
        className="fixed left-0 top-0 h-px w-px opacity-0"
        tabIndex={-1}
        onChange={onChange}
      />
    </div>
  );

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(shell, document.body);
}
