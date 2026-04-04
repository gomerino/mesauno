import type { SupabaseClient } from "@supabase/supabase-js";
import { EVENT_VENUE_FALLBACK, googleMapsSearchUrl } from "@/lib/event-maps";
import type { Invitado, Pareja } from "@/types/database";

function pick(
  parejaVal: string | null | undefined,
  invVal: string | null | undefined,
  fallback: string
): string {
  const p = parejaVal?.trim();
  if (p) return p;
  const i = invVal?.trim();
  if (i) return i;
  return fallback;
}

/** Valores efectivos para boarding pass / Wallet (pareja manda; invitado es respaldo legacy). */
export function mergeEventoParaPase(invitado: Invitado, pareja: Pareja | null) {
  const fecha =
    pareja?.fecha_evento != null && String(pareja.fecha_evento).length > 0
      ? String(pareja.fecha_evento)
      : invitado.fecha_evento != null && String(invitado.fecha_evento).length > 0
        ? String(invitado.fecha_evento)
        : null;

  const motivo = pick(pareja?.motivo_viaje, invitado.motivo_viaje, "");

  const lugarLinea = pick(
    pareja?.lugar_evento_linea,
    null,
    "Centro de eventos - La Casita de cuentos - Buin"
  );

  const footerNovios = pareja
    ? [pareja.nombre_novio_1, pareja.nombre_novio_2].filter(Boolean).join(" · ")
    : "";

  return {
    codigo_vuelo: pick(pareja?.codigo_vuelo, invitado.codigo_vuelo, "DM7726"),
    hora_embarque: pick(pareja?.hora_embarque, invitado.hora_embarque, "17:30"),
    puerta: pick(pareja?.puerta, invitado.puerta, "B"),
    asiento: pick(pareja?.asiento_default, invitado.asiento, "12A"),
    destino: pick(pareja?.destino, invitado.destino, "Forever Island"),
    nombre_evento: pick(pareja?.nombre_evento, invitado.nombre_evento, "Boda Dreams"),
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

export function boardingPassQrMapUrlMerged(invitado: Invitado, pareja: Pareja | null): string {
  const { destino } = mergeEventoParaPase(invitado, pareja);
  return googleMapsSearchUrl(resolveDestinoParaMapa(destino));
}

export async function fetchParejaForInvitado(
  supabase: SupabaseClient,
  invitado: Invitado
): Promise<Pareja | null> {
  if (invitado.pareja_id) {
    const { data } = await supabase.from("parejas").select("*").eq("id", invitado.pareja_id).maybeSingle();
    return (data ?? null) as Pareja | null;
  }
  if (invitado.owner_user_id) {
    const { data } = await supabase
      .from("parejas")
      .select("*")
      .eq("user_id", invitado.owner_user_id)
      .maybeSingle();
    return (data ?? null) as Pareja | null;
  }
  return null;
}
