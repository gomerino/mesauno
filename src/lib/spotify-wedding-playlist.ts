/** Nombre de playlist oficial para la Web API de Spotify (máx. 100 caracteres). */
export function weddingPlaylistNameFromEvento(evento: {
  nombre_evento: string | null;
  nombre_novio_1: string | null;
  nombre_novio_2: string | null;
}): string {
  const custom = evento.nombre_evento?.trim();
  if (custom) return `Boda: ${custom}`.slice(0, 100);
  const n1 = evento.nombre_novio_1?.trim();
  const n2 = evento.nombre_novio_2?.trim();
  if (n1 && n2) return `Boda: ${n1} & ${n2}`.slice(0, 100);
  if (n1) return `Boda: ${n1}`.slice(0, 100);
  if (n2) return `Boda: ${n2}`.slice(0, 100);
  return "Boda: Mesa Uno".slice(0, 100);
}
