import type { Invitado } from "@/types/database";
import { deriveEstadoEnvio } from "@/lib/invitado-estado-envio";
import { invitadoTieneTelefonoWhatsapp } from "@/lib/invitacion-whatsapp-link";
import { deriveEstadoListaInvitado } from "@/lib/panel-invitado-estado-lista";

/**
 * Puede recibir reenvío / recordatorio por correo (insistir a quienes aún no respondieron asistencia):
 * - No aceptó ni rechazó (`pendiente` en la lista del panel).
 * - Tiene email (el flujo de reenvío es por correo).
 * - Ya hubo un envío o señal de contacto (no es el “primer envío” masivo: eso es «Enviar invitaciones»).
 */
export function invitadoElegibleReenvioRecordatorio(r: Invitado): boolean {
  if (!r.email?.trim()) {
    return false;
  }
  if (deriveEstadoListaInvitado(r) !== "pendiente") {
    return false;
  }
  const e = deriveEstadoEnvio(r);
  if (e === "enviado" || e === "abierto") {
    return true;
  }
  return Boolean(r.email_enviado || r.fecha_envio || r.invitacion_vista);
}

/**
 * Insistir por WhatsApp: mismo “ya hubo contacto” y RSVP pendiente, pero exige teléfono
 * (no hace falta email).
 */
export function invitadoElegibleReenvioWhatsapp(r: Invitado): boolean {
  if (!invitadoTieneTelefonoWhatsapp(r)) {
    return false;
  }
  if (deriveEstadoListaInvitado(r) !== "pendiente") {
    return false;
  }
  const e = deriveEstadoEnvio(r);
  if (e === "enviado" || e === "abierto") {
    return true;
  }
  return Boolean(r.email_enviado || r.fecha_envio || r.invitacion_vista);
}
