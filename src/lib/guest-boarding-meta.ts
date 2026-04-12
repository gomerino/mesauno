import type { Evento, Invitado } from "@/types/database";

/** Texto multilínea del “destino” del pase = asiento (invitado o default evento). */
export function guestSeatRaw(invitado: Invitado, evento: Evento | null): string {
  const a = invitado.asiento?.trim();
  if (a) return a;
  const d = evento?.asiento_default?.trim();
  return d ?? "";
}

/** Líneas para mostrar en columna DESTINO (sin vacío). */
export function guestSeatLines(invitado: Invitado, evento: Evento | null): string[] {
  const raw = guestSeatRaw(invitado, evento);
  if (!raw) return [];
  return raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

/** Etiqueta tipo aerolínea para columna GRUPO (heurística; sin columna en BD). */
export function inferGuestGrupo(seatText: string): string {
  const t = seatText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/familia|flia|fam\.|padres|herman/.test(t)) return "Familia";
  if (/novio|novia|pareja|novi/.test(t)) return "Novios";
  if (/amigo|equipo|crew|compa|compañer/.test(t)) return "Amigos";
  if (seatText.trim().length > 0) return "Invitados";
  return "—";
}

/** Una línea para mensajes de confirmación (DESTINO). */
export function guestSeatSummaryLine(invitado: Invitado, evento: Evento | null): string {
  const lines = guestSeatLines(invitado, evento);
  if (lines.length === 0) return "tu lugar";
  return lines.join(" · ");
}
