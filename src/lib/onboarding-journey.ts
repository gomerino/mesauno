import { boardingPassQrMapUrlMerged, mergeEventoParaPase } from "@/lib/evento-boarding";
import type { Evento, Invitado } from "@/types/database";

export const ONBOARDING_JOURNEY_STORAGE_KEY = "dreams-onboarding-journey-v1";

export type OnboardingGuestDraft = {
  name: string;
  email?: string;
  phone?: string;
};

/** Grupo de viaje: titular en `invitados` + nombres en `invitado_acompanantes` (cuando se persiste en BD). */
export type OnboardingTravelGroup = {
  invitadoId?: string;
  primaryName: string;
  primaryEmail?: string;
  primaryPhone?: string;
  companions: string[];
};

export type OnboardingJourneyState = {
  eventId: string;
  persisted: boolean;
  email: string;
  partner1_name: string;
  partner2_name: string;
  event_date: string;
  event_name?: string;
  location_name?: string;
  address?: string;
  dress_code?: string;
  message?: string;
  guests: OnboardingGuestDraft[];
  travelGroup?: OnboardingTravelGroup;
};

export function defaultJourneyState(partial: Partial<OnboardingJourneyState> & { eventId: string }): OnboardingJourneyState {
  return {
    persisted: partial.persisted ?? false,
    email: partial.email ?? "",
    partner1_name: partial.partner1_name ?? "",
    partner2_name: partial.partner2_name ?? "",
    event_date: partial.event_date ?? "",
    event_name: partial.event_name,
    location_name: partial.location_name,
    address: partial.address,
    dress_code: partial.dress_code,
    message: partial.message,
    guests: partial.guests ?? [],
    travelGroup: partial.travelGroup,
    eventId: partial.eventId,
  };
}

export function loadJourneyFromStorage(): OnboardingJourneyState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ONBOARDING_JOURNEY_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as OnboardingJourneyState;
    if (p && typeof p.eventId === "string") return p;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveJourneyToStorage(state: OnboardingJourneyState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ONBOARDING_JOURNEY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/** Código estable por evento (evita parpadeo en re-renders). */
function stableFlightCode(eventId: string): string {
  let h = 0;
  for (let i = 0; i < eventId.length; i++) {
    h = (h * 31 + eventId.charCodeAt(i)) >>> 0;
  }
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let s = "";
  let x = h;
  for (let i = 0; i < 6; i++) {
    s += chars[x % chars.length];
    x = Math.imul(x, 31) >>> 0;
  }
  return s;
}

/** Construye evento + invitado sintéticos para vista previa del onboarding. */
export function buildPreviewModels(state: OnboardingJourneyState): {
  evento: Evento;
  invitado: Invitado;
  merged: ReturnType<typeof mergeEventoParaPase>;
  mapUrl: string;
} {
  const display = [state.partner1_name, state.partner2_name].filter(Boolean).join(" & ") || "Tu gran día";
  const fecha = state.event_date || new Date().toISOString().slice(0, 10);
  const loc = state.location_name?.trim() || "Destino por confirmar";
  const line =
    [state.location_name, state.address].filter((x) => x?.trim()).join(" · ") || "Lugar por confirmar";

  const evento: Evento = {
    id: state.eventId,
    nombre_novio_1: state.partner1_name || "Novio/a 1",
    nombre_novio_2: state.partner2_name || "Novio/a 2",
    fecha_boda: fecha,
    fecha_evento: fecha,
    nombre_evento: state.event_name?.trim() || `Boda ${display}`,
    destino: loc,
    codigo_vuelo: stableFlightCode(state.eventId),
    hora_embarque: "17:30",
    puerta: "B",
    asiento_default: "12A · Familia",
    motivo_viaje: state.message?.trim() || null,
    lugar_evento_linea: line,
  };

  const tg = state.travelGroup;
  const guestName =
    tg?.primaryName?.trim() ||
    state.guests[0]?.name?.trim() ||
    (state.partner1_name ? `Invitado de ${state.partner1_name.split(/\s+/)[0]}` : "Invitado de honor");

  const previewInvitadoId = "00000000-0000-4000-8000-00000000a001";
  const acompanantesPreview =
    tg?.companions?.map((nombre, i) => ({
      id: `preview-ac-${i}`,
      invitado_id: previewInvitadoId,
      nombre: nombre.trim(),
      orden: i,
    })) ?? [];

  const invitado: Invitado = {
    id: previewInvitadoId,
    nombre_pasajero: guestName,
    invitado_acompanantes: acompanantesPreview,
    email: tg?.primaryEmail ?? state.guests[0]?.email ?? null,
    telefono: tg?.primaryPhone ?? state.guests[0]?.phone ?? null,
    restricciones_alimenticias: null,
    rsvp_estado: "pendiente",
    codigo_vuelo: null,
    asiento: "12A",
    puerta: null,
    hora_embarque: null,
    destino: null,
    nombre_evento: null,
    fecha_evento: null,
    motivo_viaje: null,
    evento_id: state.eventId,
    token_acceso: "preview",
    qr_code_token: "preview-qr",
  };

  const merged = mergeEventoParaPase(invitado, evento);
  const mapUrl = boardingPassQrMapUrlMerged(invitado, evento);

  return { evento, invitado, merged, mapUrl };
}
