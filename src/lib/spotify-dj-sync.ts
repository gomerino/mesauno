/**
 * Fase 2: sincronización con Spotify Connect (sin reproducción real aún).
 */
export type SpotifyDjSyncContexto = {
  evento_id: string;
};

export async function syncToSpotify(_ctx: SpotifyDjSyncContexto): Promise<{ ok: boolean }> {
  return { ok: true };
}
