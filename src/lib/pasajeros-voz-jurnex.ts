import type { CanalEnvioInvitacion } from "@/types/database";

/**
 * Voz y microcopy (Panel Pasajeros)
 *
 * Persona: un miembro de la pareja que planifica boda, abrumado de listas, no
 * "usuario avanzado" de producto. Hablamos de invitados, carta de invitación, escribir,
 * abrir un chat y llevar al día; evitamos "registros de envío", "elegible", "sistema" y
 * tecnicismos de app.
 *
 * Tema Jurnex: "tu viaje", pasajeros, despegue — cálido y acompañas, nunca corporativo
 * de software.
 */
export function pasajerosVozJurnex(canal: CanalEnvioInvitacion) {
  switch (canal) {
    case "correo":
      return {
        cta: "Enviar invitaciones",
        /** Bajo el selector de canal (una frase) */
        bajoCanal:
          "A quien tengas con correo en la lista, le enviamos el enlace a su invitación.",
        bajoInsistir:
          "A quien ya recibió la invitación o la abrió, tiene un correo y aún no responde si asiste. No aplica a quien ya confirmó o avisó que no podrá ir.",
        hintInsistir:
          "Solo a quien ya tuvo noticia, tiene correo, asistencia pendiente, y no aceptó ni declinó.",
      };
    case "whatsapp":
      return {
        cta: "Enviar por WhatsApp",
        bajoCanal:
          "Queda en vuestro plan el saludo; tú abres el chat, aquí o en cada fila. El correo lo envías con «Correo» o «Ambos» arriba, no con «solo WhatsApp».",
        bajoInsistir:
          "A quien aún no responde, ya tuvo noticia, tiene móvil, y no aceptó ni dijo que no. No a quien ya respondió asistencia.",
        hintInsistir:
          "Misma idea con correo, pero hoy con WhatsApp. Hace falta móvil completo y contacto previo.",
      };
    case "ambos":
    default:
      return {
        cta: "Enviar invitaciones",
        bajoCanal:
          "Con email, le llega el enlace. Con WhatsApp, tú abres el mensaje (aquí o en cada fila) y vuestro viaje va al día con los dos canales.",
        bajoInsistir:
          "A quien ya tuvo noticia, con correo y aún no responde. No a quien ya aceptó o dijo que no viaja.",
        hintInsistir:
          "Correo, contacto previo, asistencia pendiente, sin aceptar ni declinar aún.",
      };
  }
}
