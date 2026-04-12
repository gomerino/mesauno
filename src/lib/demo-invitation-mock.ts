import { mergeEventoParaPase } from "@/lib/evento-boarding";
import type { Evento, Invitado } from "@/types/database";

export const ONBOARDING_DEMO_STORAGE_KEY = "dreams-onboarding-demo";

export type OnboardingDemoPayload = {
  nombreNovios: string;
  fechaEvento: string;
};

function addDaysIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function defaultDemoPayload(): OnboardingDemoPayload {
  return {
    nombreNovios: "Camila & Diego",
    fechaEvento: addDaysIso(120),
  };
}

function parseNovios(raw: string): { n1: string; n2: string | null; display: string } {
  const t = raw.trim() || "Tú & Tu pareja";
  if (t.includes("&")) {
    const [a, ...rest] = t.split("&").map((s) => s.trim());
    const b = rest.join("&").trim();
    return { n1: a || t, n2: b || null, display: t };
  }
  const y = t.split(/\s+y\s+/i);
  if (y.length >= 2) {
    return { n1: y[0]!.trim(), n2: y.slice(1).join(" y ").trim(), display: t };
  }
  return { n1: t, n2: null, display: t };
}

/** Construye invitado + evento demo coherentes con `mergeEventoParaPase` y el ticket soft aviation. */
export function buildDemoInvitacion(payload: OnboardingDemoPayload): {
  invitado: Invitado;
  evento: Evento;
  merged: ReturnType<typeof mergeEventoParaPase>;
} {
  const fecha = payload.fechaEvento.trim() || defaultDemoPayload().fechaEvento;
  const { n1, n2, display } = parseNovios(payload.nombreNovios);

  const evento: Evento = {
    id: "00000000-0000-4000-8000-00000000d002",
    nombre_novio_1: n1,
    nombre_novio_2: n2,
    fecha_boda: fecha,
    nombre_evento: `Boda ${display}`,
    fecha_evento: fecha,
    destino: "Salón Jardín Esperanza",
    codigo_vuelo: "DM7726",
    hora_embarque: "17:30",
    puerta: "B",
    asiento_default: "Mesa 12\nFamilia",
    motivo_viaje:
      "Con todo el cariño, esperamos compartir este día inolvidable contigo. ¡Nos vemos a bordo!",
    lugar_evento_linea: "Salón Jardín Esperanza · Buin",
  };

  const invitado: Invitado = {
    id: "00000000-0000-4000-8000-00000000d001",
    nombre_pasajero: "Invitado demo",
    invitado_acompanantes: [],
    email: null,
    telefono: null,
    restricciones_alimenticias: null,
    rsvp_estado: "pendiente",
    codigo_vuelo: null,
    asiento: null,
    puerta: null,
    hora_embarque: null,
    destino: null,
    nombre_evento: null,
    fecha_evento: null,
    motivo_viaje: null,
    evento_id: evento.id,
    token_acceso: "demo",
    qr_code_token: "demo-checkin",
  };

  return {
    invitado,
    evento,
    merged: mergeEventoParaPase(invitado, evento),
  };
}
