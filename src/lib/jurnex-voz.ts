/**
 * Voz Jurnex en producto (español latinoamericano neutro, tuteo)
 *
 * Hablamos a la pareja que planifica, con poco tiempo y cero paciencia para
 * tecnicismos. Tema: viaje, invitación, compañía — no "sistemas" ni "registros de envío"
 * a menos que alguien pida trazabilidad. Evitar: Supabase, JSON, token, API en
 * textos al usuario. Los desarrolladores siguen leyendo logs; el usuario, humanidad.
 */
export const JX = {
  errGenerico: "Algo no salió como esperábamos. Puedes intentar de nuevo en un momento.",
  errRed: "Parece un problema de conexión. Revisa e intenta otra vez.",
  iniciaSesion: "Hace falta tu sesión para continuar. Entra o crea una cuenta e inténtalo de nuevo.",
  copiado: "Listo, enlace copiado",
  copiadoFalla: "No pudimos copiar. Prueba tú a mano, seleccionando el enlace.",
  invitadoActualizado: "Cambios guardados para tu invitado",
  invitadoAñadido: "Añadido a tu lista de pasajeros",
  invitadoBorrado: "Ya no está en la lista",
  guardado: "Listo, guardado",
  estiloTodasInvitaciones: "El estilo ya brilla en todas las invitaciones",
  comoContactais: "Forma de avisar a los invitados: guardada",
  regalosPreferencias: "Regalos y avisos: guardado",
  eliminarFalla: "No se pudo quitar. Inténtalo otra vez.",
  emailEnviada: (una: boolean) => (una ? "Correo enviado" : "Correos enviados"),
  envioConFallos: (ok: number, n: number) =>
    n === 1
      ? `Listo para ${ok}. A una persona le faltó un detalle: revisa e inténtalo otra vez.`
      : `Listo para ${ok}. A ${n} les faltó un detalle: revisa e inténtalo otra vez.`,
  reenviado: (una: boolean) => (una ? "Recordatorio enviado" : "Recordatorios enviados"),
  /** Sin destinatarios al enviar o insistir en lote */
  colaVacia: "Nadie en cola: ya les diste el aviso o faltan datos (correo o móvil) en su ficha.",
  colaVaciaSeleccion: "Nadie en la selección está aún en espera de un aviso.",
} as const;
