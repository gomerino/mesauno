/**
 * Misma franja que «Invitados» en Viaje: línea de métricas + barra teal→oro.
 * Sin contenedor externo (el padre aplica card/grid).
 */
export function InvitacionesMetricStrip({
  totalInvitados,
  emailsEnviados,
  abrieronTrasCorreo,
}: {
  totalInvitados: number;
  emailsEnviados: number;
  abrieronTrasCorreo: number;
}) {
  const tasaAperturaPct =
    emailsEnviados > 0
      ? Math.min(100, Math.round((abrieronTrasCorreo / emailsEnviados) * 1000) / 10)
      : 0;
  const tasaStr = emailsEnviados > 0 ? `${tasaAperturaPct}%` : "—";
  const invDen = totalInvitados > 0 ? totalInvitados : 1;
  const invitadosPct =
    totalInvitados > 0 ? Math.min(100, Math.round((emailsEnviados / invDen) * 1000) / 10) : 0;
  const invitadosLine =
    totalInvitados > 0
      ? `${totalInvitados} · ${emailsEnviados}/${totalInvitados} enviados · ${tasaStr}${
          emailsEnviados > 0 ? ` · ${abrieronTrasCorreo} abiertos` : ""
        }`
      : `0 · 0/0 enviados · ${tasaStr}`;

  const pct = Math.min(100, Math.max(0, invitadosPct));

  return (
    <div>
      <p className="text-xs text-white/60">Invitados: {invitadosLine}</p>
      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={`Referencia de envíos: ${emailsEnviados} de ${totalInvitados || 0}`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-400 to-[#F5C451]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
