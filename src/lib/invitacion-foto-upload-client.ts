import type { EventoFoto } from "@/types/database";
import imageCompression from "browser-image-compression";

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

export type SubirFotoInvitacionResult =
  | { ok: true; foto: EventoFoto }
  | { ok: false; error: string; status?: number };

/**
 * Comprime y sube una imagen al álbum del evento (mismo endpoint que el FAB).
 */
export async function subirFotoInvitacionDesdeCliente(
  file: File,
  invitacionToken: string,
  options?: { onCompressPct?: (n: number) => void; onUploadPct?: (n: number) => void }
): Promise<SubirFotoInvitacionResult> {
  const tok = invitacionToken?.trim();
  if (!tok) return { ok: false, error: "Falta token de invitación" };

  options?.onCompressPct?.(12);
  const compressed = await imageCompression(file, {
    maxSizeMB: 1.2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.82,
    fileType: "image/jpeg",
  });
  options?.onCompressPct?.(100);

  const formData = new FormData();
  formData.append("token", tok);
  formData.append("file", compressed, "foto.jpg");

  const res = await uploadFormDataWithProgress(formData, (p) => options?.onUploadPct?.(p));

  if (!res.ok) {
    const msg =
      typeof res.body === "object" && res.body !== null && "error" in res.body
        ? String((res.body as { error?: string }).error)
        : "No se pudo subir la foto";
    return { ok: false, error: msg || `Error ${res.status}`, status: res.status };
  }

  const body = res.body as { ok?: boolean; foto?: EventoFoto };
  if (body?.ok && body.foto) return { ok: true, foto: body.foto };
  return { ok: false, error: "Respuesta inesperada del servidor" };
}

export const INVITACION_FOTO_SUBIDA_EVENT = "jurnex-invitacion-foto-subida";

export function emitInvitacionFotoSubida(foto: EventoFoto): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(INVITACION_FOTO_SUBIDA_EVENT, { detail: { foto } }));
}
