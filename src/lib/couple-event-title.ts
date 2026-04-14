/** Título legible para cabeceras de panel y dashboard (sin datos técnicos). */
export function formatEventTitle(evento: {
  nombre_novio_1?: string | null;
  nombre_novio_2?: string | null;
  nombre_evento?: string | null;
} | null): string {
  if (!evento) return "Tu evento";
  const a = evento.nombre_novio_1?.trim();
  const b = evento.nombre_novio_2?.trim();
  const couple = [a, b].filter(Boolean).join(" & ");
  if (couple) return couple;
  const name = evento.nombre_evento?.trim();
  return name || "Tu evento";
}
