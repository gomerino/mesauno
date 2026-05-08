/** Bloque solo lectores / indexación; `sr-only` no altera layout visual. */
export function LandingSeoSrOnly() {
  return (
    <section className="sr-only" aria-label="Información sobre Jurnex para buscadores">
      <h2>Invitaciones digitales para matrimonios en Chile</h2>
      <p>
        Jurnex es una plataforma para crear invitaciones digitales de matrimonio con confirmación de asistencia
        (RSVP), programa del evento, playlist colaborativa, mapas, dress code y gestión de invitados.
      </p>
      <p>
        Permite organizar matrimonios en Chile de forma simple, evitando planillas, WhatsApp desordenado y
        confirmaciones manuales.
      </p>
      <p>
        Los invitados pueden confirmar asistencia, revisar el programa, agregar canciones y acceder a toda la
        información desde su celular.
      </p>
    </section>
  );
}
