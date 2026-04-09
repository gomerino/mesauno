import type { SupabaseClient } from "@supabase/supabase-js";
import { EVENT_VENUE_FALLBACK, googleMapsSearchUrl } from "@/lib/event-maps";
import type { Evento, Invitado } from "@/types/database";

function asLooseClient(supabase: SupabaseClient) {
  return supabase as SupabaseClient<any>;
}

function pick(
  eventoVal: string | null | undefined,
  invVal: string | null | undefined,
  fallback: string
): string {
  const p = eventoVal?.trim();
  if (p) return p;
  const i = invVal?.trim();
  if (i) return i;
  return fallback;
}

function pickInvitadoPrimero(
  invVal: string | null | undefined,
  eventoVal: string | null | undefined,
  fallback: string
): string {
  const i = invVal?.trim();
  if (i) return i;
  const p = eventoVal?.trim();
  if (p) return p;
  return fallback;
}

/** Valores efectivos para boarding pass / Wallet (config del evento manda; invitado es respaldo legacy). */
export function mergeEventoParaPase(invitado: Invitado, evento: Evento | null) {
  const fecha =
    evento?.fecha_evento != null && String(evento.fecha_evento).length > 0
      ? String(evento.fecha_evento)
      : invitado.fecha_evento != null && String(invitado.fecha_evento).length > 0
        ? String(invitado.fecha_evento)
        : null;

  const motivo = pick(evento?.motivo_viaje, invitado.motivo_viaje, "");

  const lugarLinea = pick(
    evento?.lugar_evento_linea,
    null,
    "Centro de eventos - La Casita de cuentos - Buin"
  );

  const footerNovios = evento
    ? [evento.nombre_novio_1, evento.nombre_novio_2].filter(Boolean).join(" · ")
    : "";

  return {
    codigo_vuelo: pick(evento?.codigo_vuelo, invitado.codigo_vuelo, "DM7726"),
    hora_embarque: pick(evento?.hora_embarque, invitado.hora_embarque, "17:30"),
    puerta: pick(evento?.puerta, invitado.puerta, "B"),
    asiento: pickInvitadoPrimero(invitado.asiento, evento?.asiento_default, "12A"),
    destino: pick(evento?.destino, invitado.destino, "Forever Island"),
    nombre_evento: pick(evento?.nombre_evento, invitado.nombre_evento, "Boda Dreams"),
    fecha_evento: fecha,
    lugar_evento_linea: lugarLinea,
    motivo_viaje: motivo.length > 0 ? motivo : null,
    footerNovios,
  };
}

export function resolveDestinoParaMapa(mergedDestino: string): string {
  const globalAddr = process.env.NEXT_PUBLIC_EVENT_ADDRESS?.trim();
  if (globalAddr) return globalAddr;
  const raw = mergedDestino.trim();
  if (!raw || raw.toLowerCase() === "forever island") {
    return EVENT_VENUE_FALLBACK;
  }
  return raw;
}

export function boardingPassQrMapUrlMerged(invitado: Invitado, evento: Evento | null): string {
  const { destino } = mergeEventoParaPase(invitado, evento);
  return googleMapsSearchUrl(resolveDestinoParaMapa(destino));
}

export async function fetchEventoForInvitado(
  supabase: SupabaseClient,
  invitado: Invitado
): Promise<Evento | null> {
  const db = asLooseClient(supabase);
  if (invitado.evento_id) {
    const { data } = await db.from("eventos").select("*").eq("id", invitado.evento_id).maybeSingle();
    return (data ?? null) as Evento | null;
  }
  if (invitado.owner_user_id) {
    const uid = invitado.owner_user_id;
    const { data: memb } = await db
      .from("evento_miembros")
      .select("evento_id")
      .eq("user_id", uid)
      .limit(1)
      .maybeSingle();
    if (memb?.evento_id) {
      const { data } = await db.from("eventos").select("*").eq("id", memb.evento_id).maybeSingle();
      return (data ?? null) as Evento | null;
    }
  }
  return null;
}
