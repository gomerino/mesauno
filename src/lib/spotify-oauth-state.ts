import crypto from "crypto";
import { getSpotifyOAuthStateSecret } from "@/lib/spotify-config";

export function signSpotifyOAuthState(eventoId: string): string {
  const ts = Date.now();
  const payload = `${eventoId}.${ts}`;
  const sig = crypto.createHmac("sha256", getSpotifyOAuthStateSecret()).update(payload).digest("hex").slice(0, 32);
  return `${payload}.${sig}`;
}

export function verifySpotifyOAuthState(state: string | null, maxAgeMs = 15 * 60 * 1000): string | null {
  if (!state) return null;
  const parts = state.split(".");
  if (parts.length !== 3) return null;
  const [eventoId, tsStr, sig] = parts;
  const ts = Number(tsStr);
  if (!eventoId || !Number.isFinite(ts) || !sig) return null;
  if (Date.now() - ts > maxAgeMs) return null;
  const payload = `${eventoId}.${ts}`;
  const exp = crypto.createHmac("sha256", getSpotifyOAuthStateSecret()).update(payload).digest("hex").slice(0, 32);
  try {
    if (exp.length !== sig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(exp), Buffer.from(sig))) return null;
  } catch {
    return null;
  }
  return eventoId;
}
