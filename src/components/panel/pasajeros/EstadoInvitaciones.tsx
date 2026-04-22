"use client";

import { InvitacionesMetricStrip } from "@/components/panel/evento/InvitacionesMetricStrip";

type Props = {
  totalInvitados: number;
  emailsEnviados: number;
  abrieronTrasCorreo: number;
};

/** Mismo resumen compacto que la columna «Invitados» en Viaje (foto referencia). */
export function EstadoInvitaciones({ totalInvitados, emailsEnviados, abrieronTrasCorreo }: Props) {
  return (
    <div className="rounded-lg bg-black/30 p-3 md:p-3.5">
      <InvitacionesMetricStrip
        totalInvitados={totalInvitados}
        emailsEnviados={emailsEnviados}
        abrieronTrasCorreo={abrieronTrasCorreo}
      />
    </div>
  );
}
