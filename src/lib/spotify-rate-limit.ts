type Bucket = { count: number; resetAt: number };

const searchBuckets = new Map<string, Bucket>();
const addBuckets = new Map<string, Bucket>();

const MAX_SEARCH_PER_WINDOW = 24;
const SEARCH_WINDOW_MS = 60_000;

const MAX_ADD_PER_WINDOW = 15;
const ADD_WINDOW_MS = 60_000;

function allow(map: Map<string, Bucket>, key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  let b = map.get(key);
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + windowMs };
    map.set(key, b);
  }
  if (b.count >= max) return false;
  b.count += 1;
  if (map.size > 20_000) {
    const keys = Array.from(map.keys());
    for (const k of keys) {
      const v = map.get(k);
      if (v && now > v.resetAt) map.delete(k);
    }
  }
  return true;
}

export function rateLimitSpotifySearch(ip: string): boolean {
  return allow(searchBuckets, ip || "unknown", MAX_SEARCH_PER_WINDOW, SEARCH_WINDOW_MS);
}

export function rateLimitPlaylistAdd(ip: string): boolean {
  return allow(addBuckets, ip || "unknown", MAX_ADD_PER_WINDOW, ADD_WINDOW_MS);
}
