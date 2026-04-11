/** Cuerpo de error de Spotify (similar a `error.response.data` en axios). */
export function parseSpotifyApiErrorBody(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

/**
 * Log detallado cuando la Web API de Spotify falla (especialmente 403).
 * Incluye el cuerpo parseado para detectar p. ej. usuario no registrado en el dashboard de la app.
 */
export function logSpotifyApiError(context: string, status: number, bodyText: string): void {
  const data = parseSpotifyApiErrorBody(bodyText);
  const payload = { status, data };
  console.error(`[spotify] ${context}`, JSON.stringify(payload));

  if (status !== 403) return;

  const flat = typeof data === "string" ? data : JSON.stringify(data);
  if (/not registered in the Developer Dashboard|not registered/i.test(flat)) {
    console.error(
      "[spotify] 403: posible causa — la cuenta de Spotify no está en “Users and access” de la app en developer.spotify.com."
    );
  }
}
