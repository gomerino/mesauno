import { guestSeatRaw } from "@/lib/guest-boarding-meta";
import { isEventDayLocal } from "@/lib/invite-event-day";
import type { Evento, Invitado } from "@/types/database";

/** Estado derivado único para la invitación premium (boarding pass). */
export type SoftAviationInviteFlags = {
  isConfirmed: boolean;
  isEventDay: boolean;
  /** Asiento / destino en el pase (texto multilínea en BD). */
  guestSeat: string;
};

export function computeSoftAviationInviteFlags(
  rsvpEstado: string | null | undefined,
  fechaEvento: string | null | undefined,
  invitado: Invitado,
  evento: Evento | null
): SoftAviationInviteFlags {
  return {
    isConfirmed: rsvpEstado === "confirmado",
    isEventDay: isEventDayLocal(fechaEvento),
    guestSeat: guestSeatRaw(invitado, evento),
  };
}
