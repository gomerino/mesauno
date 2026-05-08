/** Texto semántico para indexación; no afecta layout visual (`sr-only`). */
export function InvitacionSemanticaSrOnly() {
  return (
    <section className="sr-only" aria-label="Resumen de la invitación para buscadores">
      <h2>Invitación digital de matrimonio</h2>
      <p>
        Esta es una invitación digital con confirmación de asistencia, programa del evento y detalles del
        matrimonio.
      </p>
    </section>
  );
}
