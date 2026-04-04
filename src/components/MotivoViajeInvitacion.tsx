type Props = {
  texto: string | null | undefined;
};

/** Cuadro “motivo del viaje” encima del formulario RSVP (columna derecha). */
export function MotivoViajeInvitacion({ texto }: Props) {
  const t = texto?.trim();
  if (!t) return null;

  return (
    <div className="mb-3 rounded-xl border border-[#001d66]/25 bg-gradient-to-br from-white to-[#f8f9ff] p-3 shadow-[0_2px_16px_rgba(0,29,102,0.08)] sm:p-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#001d66]/80">Motivo del viaje</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{t}</p>
    </div>
  );
}
