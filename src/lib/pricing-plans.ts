export type PricingPlanId = "esencial" | "experiencia";

/** Persistido en cliente tras flujos anteriores (compat). */
export const PRICING_PLAN_STORAGE_KEY = "dreams_selected_pricing_plan";

export const PRICING_PLANS = {
  esencial: {
    id: "esencial" as const,
    name: "Evento Esencial ✈️",
    /** Título del ítem en Mercado Pago (sin emojis; la API puede rechazar caracteres especiales). */
    mpItemTitle: "Dreams - Evento Esencial",
    description: "Todo lo necesario para organizar tu evento de forma simple",
    priceLabel: "$19.990 CLP",
    priceClp: 19_990,
    features: [
      "Invitaciones digitales",
      "Envío por correo electrónico",
      "Confirmación de asistencia (RSVP)",
      "Gestión de invitados y mesas",
    ],
    cta: "Empezar con Esencial",
  },
  experiencia: {
    id: "experiencia" as const,
    name: "Evento Experiencia ✨",
    mpItemTitle: "Dreams - Evento Experiencia",
    badge: "Más elegido",
    tagline: "Recomendado para la mayoría de los eventos",
    description: "Convierte tu evento en una experiencia inolvidable para tus invitados",
    priceLabel: "$34.990 CLP",
    priceClp: 34_990,
    features: [
      "Todo lo del plan esencial",
      "Envío por WhatsApp",
      "Álbum de fotos en tiempo real",
      "Playlist colaborativa",
      "Programa del evento",
      "Check-in con QR",
    ],
    cta: "Quiero la experiencia completa ✨",
  },
} as const;

export function isPricingPlanId(value: string | null | undefined): value is PricingPlanId {
  return value === "esencial" || value === "experiencia";
}

export function planDisplayName(id: PricingPlanId): string {
  return id === "esencial" ? "Evento Esencial" : "Evento Experiencia";
}
