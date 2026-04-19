/**
 * Persistencia de draft del registro de proveedor en localStorage.
 * TTL: 7 días. Después, el draft se considera inválido y se ignora.
 * Se limpia al completar paso 3.
 */

const STORAGE_KEY = "jurnex:proveedor-registro-draft";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type DraftRegistro = {
  step: 1 | 2 | 3;
  email?: string;
  nombreNegocio?: string;
  categoriaPrincipal?: string;
  region?: string;
  ciudad?: string;
  eslogan?: string;
  biografia?: string;
  whatsapp?: string;
  instagram?: string;
  sitioWeb?: string;
};

type Envelope = {
  data: DraftRegistro;
  updated_at: string;
};

export function leerDraftRegistro(): DraftRegistro | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const env = JSON.parse(raw) as Envelope;
    if (!env?.updated_at) return null;
    const age = Date.now() - new Date(env.updated_at).getTime();
    if (Number.isNaN(age) || age > TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return env.data ?? null;
  } catch {
    return null;
  }
}

export function guardarDraftRegistro(data: DraftRegistro): void {
  if (typeof window === "undefined") return;
  try {
    const env: Envelope = { data, updated_at: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(env));
  } catch {
    // storage lleno o bloqueado — silencio.
  }
}

export function limpiarDraftRegistro(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
