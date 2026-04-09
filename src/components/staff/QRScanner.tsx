"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";

async function importHtml5Qrcode() {
  const mod = await import("html5-qrcode");
  return mod.Html5Qrcode;
}

export type QRScannerProps = {
  onScan: (decodedText: string) => void;
  /** Si es false, se detiene la cámara (p. ej. mientras se valida en el servidor). */
  scanningEnabled: boolean;
};

type ViewState =
  | "idle"
  | "permission_denied"
  | "unsupported"
  | "camera_pick"
  | "scanning"
  | "starting";

function applyIosVideoHints(root: HTMLElement) {
  root.querySelectorAll("video").forEach((el) => {
    const v = el as HTMLVideoElement;
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
  });
}

function isPermissionDeniedError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const name = (e as { name?: string }).name;
  return name === "NotAllowedError" || name === "PermissionDeniedError";
}

function isMediaNotFoundError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const name = (e as { name?: string }).name;
  return name === "NotFoundError" || name === "DevicesNotFoundError";
}

export function QRScanner({ onScan, scanningEnabled }: QRScannerProps) {
  const reactId = useId().replace(/:/g, "");
  const readerId = `staff-qr-reader-${reactId}`;
  const readerRef = useRef<HTMLDivElement | null>(null);
  const html5Ref = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const scanHandledRef = useRef(false);

  const [view, setView] = useState<ViewState>("idle");
  const [hasStartedOnce, setHasStartedOnce] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [pickedCameraId, setPickedCameraId] = useState<string>("");
  const cameraPickActiveRef = useRef(false);

  const stopScanner = useCallback(async () => {
    const instance = html5Ref.current;
    if (!instance?.isScanning) return;
    try {
      await instance.stop();
    } catch {
      /* ignore */
    }
    try {
      instance.clear();
    } catch {
      /* ignore */
    }
  }, []);

  const ensureInstance = useCallback(async () => {
    if (html5Ref.current) return html5Ref.current;
    const Html5Qrcode = await importHtml5Qrcode();
    html5Ref.current = new Html5Qrcode(readerId, { verbose: false });
    return html5Ref.current;
  }, [readerId]);

  const scheduleVideoHints = useCallback(() => {
    const el = readerRef.current;
    if (!el) return;
    const run = () => applyIosVideoHints(el);
    run();
    requestAnimationFrame(run);
    setTimeout(run, 50);
    setTimeout(run, 250);
  }, []);

  const qrbox = useCallback((viewfinderWidth: number, viewfinderHeight: number) => {
    const m = Math.min(viewfinderWidth, viewfinderHeight);
    const side = Math.max(160, Math.floor(m * 0.72));
    return { width: side, height: side };
  }, []);

  const runStart = useCallback(
    async (cameraIdOrConfig: string | MediaTrackConstraints) => {
      const instance = await ensureInstance();
      scanHandledRef.current = false;
      setView("starting");

      const onSuccess = (decodedText: string) => {
        const text = decodedText.trim();
        if (!text || scanHandledRef.current) return;
        scanHandledRef.current = true;
        setHasStartedOnce(true);
        void (async () => {
          try {
            await instance.stop();
          } catch {
            /* ignore */
          }
          try {
            instance.clear();
          } catch {
            /* ignore */
          }
          setView("idle");
          onScanRef.current(text);
        })();
      };

      const onScanFailure = () => {};

      try {
        await instance.start(cameraIdOrConfig, { fps: 10, qrbox, aspectRatio: 1.0 }, onSuccess, onScanFailure);
        cameraPickActiveRef.current = false;
        setView("scanning");
        scheduleVideoHints();
      } catch (e) {
        try {
          if (instance.isScanning) await instance.stop();
        } catch {
          /* ignore */
        }
        try {
          instance.clear();
        } catch {
          /* ignore */
        }
        if (isPermissionDeniedError(e)) {
          setView("permission_denied");
          toast.error("Permiso de cámara denegado");
          return;
        }
        setView(cameraPickActiveRef.current ? "camera_pick" : "idle");
        throw e;
      }
    },
    [ensureInstance, qrbox, scheduleVideoHints]
  );

  const tryStartCamera = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!window.isSecureContext) {
      setView("unsupported");
      toast.error("La cámara requiere HTTPS o localhost");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setView("unsupported");
      toast.error("Tu navegador no permite acceso a la cámara");
      return;
    }

    setView("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      if (isPermissionDeniedError(e)) {
        setView("permission_denied");
        toast.error("Permiso de cámara denegado");
        return;
      }
      if (isMediaNotFoundError(e)) {
        toast.error("No se detectó ninguna cámara");
        setView("idle");
        return;
      }
      toast.error("No se pudo acceder a la cámara");
      setView("idle");
      return;
    }

    const Html5Qrcode = await importHtml5Qrcode();
    let list: { id: string; label: string }[] = [];
    try {
      list = await Html5Qrcode.getCameras();
    } catch {
      toast.error("No se pudo listar las cámaras");
      setView("idle");
      return;
    }

    if (list.length === 0) {
      toast.error("No hay cámaras disponibles");
      setView("idle");
      return;
    }

    try {
      await runStart({ facingMode: { ideal: "environment" } });
      return;
    } catch {
      /* intentar otra cámara o selector manual */
    }

    if (list.length > 1) {
      try {
        await runStart(list[0].id);
        return;
      } catch {
        /* mostrar selector */
      }
      cameraPickActiveRef.current = true;
      setCameras(list);
      setPickedCameraId(list[0].id);
      setView("camera_pick");
      toast.message("Varias cámaras detectadas", {
        description: "Elige cuál usar para escanear.",
      });
      return;
    }

    try {
      await runStart(list[0].id);
    } catch (e) {
      if (isPermissionDeniedError(e)) {
        setView("permission_denied");
        return;
      }
      toast.error("No se pudo iniciar la cámara");
      setView("idle");
    }
  }, [runStart]);

  const startWithPickedCamera = useCallback(async () => {
    if (!pickedCameraId) return;
    try {
      await runStart(pickedCameraId);
    } catch (e) {
      if (isPermissionDeniedError(e)) {
        setView("permission_denied");
        toast.error("Permiso de cámara denegado");
        return;
      }
      toast.error("No se pudo abrir la cámara seleccionada");
    }
  }, [pickedCameraId, runStart]);

  useEffect(() => {
    if (!scanningEnabled) {
      void stopScanner();
      setView((v) => (v === "scanning" || v === "starting" ? "idle" : v));
    }
  }, [scanningEnabled, stopScanner]);

  useEffect(() => {
    return () => {
      void stopScanner();
      html5Ref.current = null;
    };
  }, [stopScanner]);

  const primaryLabel = hasStartedOnce ? "Escanear siguiente" : "Iniciar Escáner";

  return (
    <div className="flex w-full flex-col gap-4">
      {view === "permission_denied" && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          La cámara es necesaria para el Check-in. Por favor, actívala en la configuración de tu navegador.
        </div>
      )}

      {view === "unsupported" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          Este dispositivo o navegador no permite usar la cámara desde la web. Prueba con Safari o Chrome actualizado
          en HTTPS.
        </div>
      )}

      {view === "camera_pick" && (
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-300">Selecciona la cámara a usar (por ejemplo, la frontal en escritorio).</p>
          <select
            value={pickedCameraId}
            onChange={(e) => setPickedCameraId(e.target.value)}
            className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          >
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label?.trim() || "Cámara"}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void startWithPickedCamera()}
            disabled={!pickedCameraId}
            className="rounded-xl bg-teal-500 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/30 disabled:opacity-50"
          >
            Usar esta cámara
          </button>
        </div>
      )}

      {(view === "idle" || view === "permission_denied") && (
        <button
          type="button"
          onClick={() => void tryStartCamera()}
          className="rounded-xl bg-teal-500 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/30"
        >
          {view === "permission_denied" ? "Reintentar" : primaryLabel}
        </button>
      )}

      {(view === "scanning" || view === "starting") && (
        <div className="relative mx-auto w-full max-w-md">
          <div
            className="relative aspect-[3/4] w-full max-h-[min(75vh,560px)] overflow-hidden rounded-2xl bg-black ring-1 ring-white/10 [@media(orientation:landscape)]:aspect-[4/3] [@media(orientation:landscape)]:max-h-[min(70vh,520px)]"
            style={{ minHeight: 220 }}
          >
            <div id={readerId} ref={readerRef} className="absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
            <div
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4"
              aria-hidden
            >
              <div className="relative aspect-square w-[min(72vmin,280px)] sm:w-[min(65vmin,320px)]">
                <div className="absolute inset-0 rounded-lg border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                <div className="absolute -left-0.5 -top-0.5 h-6 w-6 border-l-4 border-t-4 border-teal-300" />
                <div className="absolute -right-0.5 -top-0.5 h-6 w-6 border-r-4 border-t-4 border-teal-300" />
                <div className="absolute -bottom-0.5 -left-0.5 h-6 w-6 border-b-4 border-l-4 border-teal-300" />
                <div className="absolute -bottom-0.5 -right-0.5 h-6 w-6 border-b-4 border-r-4 border-teal-300" />
              </div>
            </div>
            {view === "starting" && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 text-sm text-white">
                Iniciando cámara…
              </div>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-slate-500">Encuadra el QR dentro del recuadro</p>
        </div>
      )}
    </div>
  );
}
