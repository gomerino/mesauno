import type { Invitado } from "@/types/database";

/** Coincide con el texto por defecto del boarding pass cuando `destino` es genérico. */
export const EVENT_VENUE_FALLBACK = "Centro de Eventos La Casita de Cuentos, Buin";

/**
 * Dirección usada para mapas y para mostrar el lugar del evento.
 * - `NEXT_PUBLIC_EVENT_ADDRESS`: fuerza la misma dirección para todo el sitio (producción).
 * - Si no, usa `destino` del invitado; si viene vacío o "Forever Island", usa el fallback.
 */
export function resolveEventVenueAddress(inv: Pick<Invitado, "destino">): string {
  const globalAddr = process.env.NEXT_PUBLIC_EVENT_ADDRESS?.trim();
  if (globalAddr) return globalAddr;

  const raw = inv.destino?.trim() ?? "";
  if (!raw || raw.toLowerCase() === "forever island") {
    return EVENT_VENUE_FALLBACK;
  }
  return raw;
}

/** URL de Google Maps (abre app o web en el móvil). */
export function googleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Contenido del QR del boarding pass: siempre enlace al mapa de la dirección del evento. */
export function boardingPassQrMapUrl(inv: Pick<Invitado, "destino">): string {
  return googleMapsSearchUrl(resolveEventVenueAddress(inv));
}

export function isMapsQrPayload(qrValue: string): boolean {
  return (
    qrValue.includes("google.com/maps") ||
    qrValue.includes("maps.app.goo.gl") ||
    qrValue.includes("goo.gl/maps") ||
    qrValue.includes("maps.apple.com")
  );
}
